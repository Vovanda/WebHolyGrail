#!/usr/bin/env tsx
/**
 * sync-infisical.ts — apply WHG_SECRET_TEMPLATE к существующему Infisical project.
 *
 * Идемпотентно: создаёт отсутствующие ключи, не трогает уже заданные значения.
 * Для kind=external (MinIO admin creds) — читает из источника, обновляет если
 * текущее значение пусто или явно стало placeholder'ом.
 *
 * Запуск с локальной машины (admin UA):
 *   pnpm sync-infisical -- --slug whg --domain whg.sawking.tech
 *
 * Запуск на VPS (admin UA из env или из bootstrap для self-host):
 *   SLUG=whg PRIMARY_DOMAIN=whg.sawking.tech \
 *     ts-node scripts/sync-infisical.ts
 *
 * Env (обязательно):
 *   INFISICAL_HOST_URL              self-host URL
 *   INFISICAL_ADMIN_CLIENT_ID       admin UA client id
 *   INFISICAL_ADMIN_CLIENT_SECRET   admin UA client secret
 *
 * Optional:
 *   MINIO_ADMIN_USER / MINIO_ADMIN_PASSWORD  — для kind=external. Если запускаем
 *     на VPS, скрипт сам подтянет из docker inspect minio.
 */

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';

import {
  WHG_SECRET_TEMPLATE,
  contextFrom,
  type SecretSpec,
  type TemplateContext,
} from './infisical-template.js';

interface Args {
  slug: string;
  domain: string;
  projectSlug: string;
  envSlug: string;
  dryRun: boolean;
}

function parseArguments(): Args {
  const { values } = parseArgs({
    options: {
      slug: { type: 'string' },
      domain: { type: 'string' },
      'project-slug': { type: 'string' },
      'env-slug': { type: 'string', default: 'prod' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  const slug = values.slug ?? process.env.SLUG;
  const domain = values.domain ?? process.env.PRIMARY_DOMAIN;
  if (!slug || !domain) {
    console.error(
      'Usage: sync-infisical --slug <slug> --domain <primary-domain> [--env-slug prod]',
    );
    console.error('   or set SLUG + PRIMARY_DOMAIN env');
    process.exit(2);
  }
  return {
    slug,
    domain,
    projectSlug: values['project-slug'] ?? `holygrail-${slug}`,
    envSlug: values['env-slug'] ?? 'prod',
    dryRun: values['dry-run'] ?? false,
  };
}

interface Env {
  hostUrl: string;
  clientId: string;
  clientSecret: string;
}

function readEnv(): Env {
  const hostUrl = process.env.INFISICAL_HOST_URL;
  const clientId = process.env.INFISICAL_ADMIN_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_ADMIN_CLIENT_SECRET;
  if (!hostUrl || !clientId || !clientSecret) {
    console.error(
      'Missing env: INFISICAL_HOST_URL, INFISICAL_ADMIN_CLIENT_ID, INFISICAL_ADMIN_CLIENT_SECRET',
    );
    process.exit(2);
  }
  return { hostUrl, clientId, clientSecret };
}

async function login(env: Env): Promise<string> {
  const res = await fetch(`${env.hostUrl}/api/v1/auth/universal-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: env.clientId, clientSecret: env.clientSecret }),
  });
  if (!res.ok) {
    throw new Error(`login: HTTP ${res.status} — ${await res.text()}`);
  }
  const json = (await res.json()) as { accessToken: string };
  return json.accessToken;
}

async function findProjectId(env: Env, token: string, projectSlug: string): Promise<string> {
  const res = await fetch(`${env.hostUrl}/api/v1/workspace`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`list workspaces: HTTP ${res.status}`);
  const json = (await res.json()) as { workspaces: Array<{ id: string; slug: string }> };
  const found = json.workspaces.find(
    (w) => w.slug === projectSlug || w.slug.startsWith(`${projectSlug}-`),
  );
  if (!found) throw new Error(`project "${projectSlug}" not found`);
  return found.id;
}

interface ExistingSecret {
  key: string;
  value: string;
}

async function listSecrets(
  env: Env,
  token: string,
  projectId: string,
  envSlug: string,
): Promise<ExistingSecret[]> {
  const res = await fetch(
    `${env.hostUrl}/api/v3/secrets/raw?workspaceId=${projectId}&environment=${envSlug}&secretPath=/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`list secrets: HTTP ${res.status}`);
  const json = (await res.json()) as { secrets: Array<{ secretKey: string; secretValue: string }> };
  return json.secrets.map((s) => ({ key: s.secretKey, value: s.secretValue }));
}

async function createSecret(
  env: Env,
  token: string,
  projectId: string,
  envSlug: string,
  key: string,
  value: string,
  comment: string,
): Promise<void> {
  const res = await fetch(`${env.hostUrl}/api/v3/secrets/raw/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId: projectId,
      environment: envSlug,
      secretValue: value,
      secretComment: comment,
      secretPath: '/',
      type: 'shared',
    }),
  });
  if (!res.ok) throw new Error(`create ${key}: HTTP ${res.status} — ${await res.text()}`);
}

function generate(generator: 'hex32' | 'hex16' | 'base64-24'): string {
  if (generator === 'hex32') return randomBytes(32).toString('hex');
  if (generator === 'hex16') return randomBytes(16).toString('hex');
  return randomBytes(24).toString('base64').replace(/[/+=]/g, '');
}

function resolveExternal(spec: Extract<SecretSpec, { kind: 'external' }>): string | null {
  const src = spec.source;
  if (src.type === 'minio-admin-user') {
    if (process.env.MINIO_ADMIN_USER) return process.env.MINIO_ADMIN_USER;
    try {
      const out = execSync(
        "docker inspect minio --format '{{range .Config.Env}}{{println .}}{{end}}'",
        { encoding: 'utf8' },
      );
      const line = out.split('\n').find((l) => l.startsWith('MINIO_ROOT_USER='));
      return line ? line.slice('MINIO_ROOT_USER='.length) : null;
    } catch {
      return null;
    }
  }
  if (src.type === 'minio-admin-password') {
    if (process.env.MINIO_ADMIN_PASSWORD) return process.env.MINIO_ADMIN_PASSWORD;
    try {
      const out = execSync(
        "docker inspect minio --format '{{range .Config.Env}}{{println .}}{{end}}'",
        { encoding: 'utf8' },
      );
      const line = out.split('\n').find((l) => l.startsWith('MINIO_ROOT_PASSWORD='));
      return line ? line.slice('MINIO_ROOT_PASSWORD='.length) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function resolveValue(spec: SecretSpec, ctx: TemplateContext): string | null {
  if (spec.kind === 'hardcoded') return spec.value(ctx);
  if (spec.kind === 'generated') return generate(spec.generator);
  if (spec.kind === 'external') return resolveExternal(spec);
  if (spec.kind === 'manual') return spec.placeholder ?? `TODO_SET_${spec.key}`;
  return null;
}

async function main(): Promise<void> {
  const args = parseArguments();
  const env = readEnv();
  const ctx = contextFrom(args.slug, args.domain);

  console.log(`\n→ sync-infisical: project=${args.projectSlug}, env=${args.envSlug}`);
  console.log(`   ctx: slug=${ctx.slug}, domain=${ctx.primaryDomain}, root=${ctx.rootDomain}`);
  if (args.dryRun) console.log('   (DRY RUN — no writes)');

  const token = await login(env);
  console.log('   ✓ admin UA login');

  const projectId = await findProjectId(env, token, args.projectSlug);
  console.log(`   ✓ project id: ${projectId}`);

  const existing = await listSecrets(env, token, projectId, args.envSlug);
  const existingMap = new Map(existing.map((s) => [s.key, s.value]));
  console.log(`   ✓ existing keys: ${existing.length}`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const spec of WHG_SECRET_TEMPLATE) {
    const currentValue = existingMap.get(spec.key);
    if (currentValue !== undefined && currentValue.length > 0) {
      console.log(`   = ${spec.key.padEnd(32)} skip (already set)`);
      skipped++;
      continue;
    }

    const newValue = resolveValue(spec, ctx);
    if (newValue == null || newValue.length === 0) {
      console.log(`   ! ${spec.key.padEnd(32)} skip (cannot resolve ${spec.kind})`);
      failed++;
      continue;
    }

    if (args.dryRun) {
      const preview = spec.kind === 'hardcoded' ? newValue : `<${spec.kind}>`;
      console.log(`   + ${spec.key.padEnd(32)} would create = ${preview}`);
      created++;
      continue;
    }

    try {
      await createSecret(
        env,
        token,
        projectId,
        args.envSlug,
        spec.key,
        newValue,
        spec.comment ?? '',
      );
      const preview = spec.kind === 'hardcoded' ? newValue : `<${spec.kind} ✓>`;
      console.log(`   + ${spec.key.padEnd(32)} created = ${preview}`);
      created++;
    } catch (err) {
      console.log(`   ✗ ${spec.key.padEnd(32)} ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(
    `\n   summary: created=${created}, skipped=${skipped}, failed=${failed}` +
      (failed > 0 ? ' (некоторые ключи требуют ручного ввода — см. логи)' : ''),
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
