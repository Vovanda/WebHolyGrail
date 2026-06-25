#!/usr/bin/env tsx
/**
 * setup-infisical.ts — bootstrap нового Holy Grail сайта на self-host Infisical.
 *
 * Делает через REST (native fetch — без SDK для consistency):
 *  1. Login admin Universal Auth identity → accessToken
 *  2. Create project `holygrail-<slug>`
 *  3. Create environments dev / staging / prod
 *  4. Seed placeholder secrets во все env
 *  5. Create service identity `<slug>-prod-deploy`
 *  6. Attach Universal Auth к identity
 *  7. Create client secret для identity
 *  8. Add identity к project с role
 *  9. Write `.infisical.json`
 * 10. Print Client ID + Client Secret для VPS
 *
 * Запуск:
 *   pnpm setup-infisical -- --site <slug>
 *
 * Env (обязательно):
 *   INFISICAL_HOST_URL              — URL self-host instance (https://infisical.<your-domain>.tld)
 *   INFISICAL_ADMIN_CLIENT_ID       — admin UA client ID (из `infisical bootstrap`)
 *   INFISICAL_ADMIN_CLIENT_SECRET   — admin UA client secret
 *   INFISICAL_ADMIN_ORG_ID          — orgId (из `infisical bootstrap` output)
 *
 * Документация:
 *   - `.claude/skills/whg-infisical/SKILL.md` — workflow для агента
 *   - `docs/stack/infisical.md` — стек, версии, инструменты
 *   - `docs/whg/37-scaffolding.md` — human-readable scaffold guide
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

interface Args {
  site: string;
  outDir: string;
  type: string;
}

interface AdminEnv {
  hostUrl: string;
  clientId: string;
  clientSecret: string;
  orgId: string;
}

const STANDARD_SECRETS = [
  // Payload CMS
  'PAYLOAD_SECRET',
  'DATABASE_URI',
  'PAYLOAD_PUBLIC_SERVER_URL',
  'PAYLOAD_ALLOWED_ORIGINS',
  // Client
  'NEXT_PUBLIC_CMS_URL',
  'NEXT_PUBLIC_SITE_URL',
  // Site identity
  'SITE_NAME',
  // S3 / CDN
  'S3_BUCKET',
  'S3_REGION',
  'S3_ENDPOINT',
  'S3_PUBLIC_URL',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  // Analytics (optional)
  'NEXT_PUBLIC_YM_ID',
];

const ENVIRONMENTS = [
  { name: 'Development', slug: 'dev', position: 1 },
  { name: 'Staging', slug: 'staging', position: 2 },
  { name: 'Production', slug: 'prod', position: 3 },
];

function parseArguments(): Args {
  const { values } = parseArgs({
    options: {
      site: { type: 'string', short: 's' },
      'out-dir': { type: 'string', default: '.' },
      type: { type: 'string', default: 'minimal' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help || !values.site) {
    console.error(
      'Usage: pnpm setup-infisical -- --site <slug> [--type minimal|business-card|blog|portal]',
    );
    console.error('  --site <slug>      site identifier (e.g. "sawking-tech")');
    console.error('  --type <preset>    project type preset (default: minimal)');
    console.error('  --out-dir <path>   where to write .infisical.json (default: .)');
    console.error('');
    console.error('Required env:');
    console.error('  INFISICAL_HOST_URL              self-host URL');
    console.error('  INFISICAL_ADMIN_CLIENT_ID       admin UA client ID');
    console.error('  INFISICAL_ADMIN_CLIENT_SECRET   admin UA client secret');
    console.error('  INFISICAL_ADMIN_ORG_ID          org ID');
    process.exit(values.help ? 0 : 1);
  }

  return {
    site: values.site as string,
    outDir: resolve(values['out-dir'] ?? '.'),
    type: values.type as string,
  };
}

function readAdminEnv(): AdminEnv {
  const hostUrl = process.env['INFISICAL_HOST_URL'];
  const clientId = process.env['INFISICAL_ADMIN_CLIENT_ID'];
  const clientSecret = process.env['INFISICAL_ADMIN_CLIENT_SECRET'];
  const orgId = process.env['INFISICAL_ADMIN_ORG_ID'];

  const missing: string[] = [];
  if (!hostUrl) missing.push('INFISICAL_HOST_URL');
  if (!clientId) missing.push('INFISICAL_ADMIN_CLIENT_ID');
  if (!clientSecret) missing.push('INFISICAL_ADMIN_CLIENT_SECRET');
  if (!orgId) missing.push('INFISICAL_ADMIN_ORG_ID');

  if (missing.length > 0) {
    console.error(`ERROR: missing env: ${missing.join(', ')}`);
    console.error('Run `infisical bootstrap` on VPS first, then set env from output.');
    console.error('See docs/stack/infisical.md → "Bootstrap admin identity".');
    process.exit(1);
  }

  return {
    hostUrl: hostUrl!.replace(/\/$/, ''),
    clientId: clientId!,
    clientSecret: clientSecret!,
    orgId: orgId!,
  };
}

class Infisical {
  constructor(
    private readonly hostUrl: string,
    private accessToken: string | null = null,
  ) {}

  async login(clientId: string, clientSecret: string): Promise<void> {
    const res = await this.fetch('POST', '/api/v1/auth/universal-auth/login', {
      clientId,
      clientSecret,
    });
    this.accessToken = (res as { accessToken: string }).accessToken;
    if (!this.accessToken) throw new Error('login: no accessToken in response');
  }

  async createProject(slug: string, orgId: string): Promise<string> {
    const res = await this.fetch('POST', '/api/v2/workspace', {
      projectName: `holygrail-${slug}`,
      slug: `holygrail-${slug}`,
      type: 'secret-manager',
      projectDescription: `Holy Grail site: ${slug}`,
      organizationId: orgId,
    });
    const projectId =
      (res as { project?: { id?: string } }).project?.id ?? (res as { id?: string }).id;
    if (!projectId) throw new Error('createProject: no project id in response');
    return projectId;
  }

  async createEnvironment(
    projectId: string,
    env: { name: string; slug: string; position: number },
  ): Promise<void> {
    await this.fetch('POST', `/api/v1/workspace/${projectId}/environments`, env);
  }

  async createSecret(
    projectId: string,
    envSlug: string,
    key: string,
    value: string,
    comment: string,
  ): Promise<void> {
    await this.fetch('POST', `/api/v3/secrets/raw/${encodeURIComponent(key)}`, {
      workspaceId: projectId,
      environment: envSlug,
      secretValue: value,
      secretComment: comment,
      secretPath: '/',
      type: 'shared',
    });
  }

  async createIdentity(name: string, orgId: string): Promise<string> {
    const res = await this.fetch('POST', '/api/v1/identities', {
      name,
      organizationId: orgId,
      role: 'no-access',
    });
    const identityId =
      (res as { identity?: { id?: string } }).identity?.id ?? (res as { id?: string }).id;
    if (!identityId) throw new Error('createIdentity: no identity id in response');
    return identityId;
  }

  async attachUniversalAuth(identityId: string): Promise<string> {
    const res = await this.fetch('POST', `/api/v1/auth/universal-auth/identities/${identityId}`, {
      accessTokenTTL: 2592000,
      accessTokenMaxTTL: 2592000,
      accessTokenNumUsesLimit: 0,
      clientSecretTrustedIps: [{ ipAddress: '0.0.0.0/0' }],
      accessTokenTrustedIps: [{ ipAddress: '0.0.0.0/0' }],
    });
    const clientId = (res as { identityUniversalAuth?: { clientId?: string } })
      .identityUniversalAuth?.clientId;
    if (!clientId) throw new Error('attachUniversalAuth: no clientId in response');
    return clientId;
  }

  async createClientSecret(identityId: string, description: string): Promise<string> {
    const res = await this.fetch(
      'POST',
      `/api/v1/auth/universal-auth/identities/${identityId}/client-secrets`,
      { description, ttl: 0, numUsesLimit: 0 },
    );
    const clientSecret = (res as { clientSecret?: string }).clientSecret;
    if (!clientSecret) throw new Error('createClientSecret: no clientSecret in response');
    return clientSecret;
  }

  async addIdentityToProject(
    projectId: string,
    identityId: string,
    role: 'viewer' | 'no-access' = 'no-access',
  ): Promise<void> {
    await this.fetch('POST', `/api/v2/workspace/${projectId}/identity-memberships/${identityId}`, {
      role,
    });
  }

  private async fetch(method: string, path: string, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.accessToken) headers['authorization'] = `Bearer ${this.accessToken}`;

    const res = await globalThis.fetch(`${this.hostUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} → ${res.status} ${res.statusText}\n${text}`);
    }

    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }
}

async function main(): Promise<void> {
  const args = parseArguments();
  const env = readAdminEnv();

  console.log(`\n  Holy Grail — Infisical setup для "${args.site}" (type: ${args.type})`);
  console.log(`  Host: ${env.hostUrl}\n`);

  const inf = new Infisical(env.hostUrl);

  console.log('→ login (admin UA)');
  await inf.login(env.clientId, env.clientSecret);
  console.log('  ✓ authenticated');

  console.log(`→ createProject(holygrail-${args.site})`);
  const projectId = await inf.createProject(args.site, env.orgId);
  console.log(`  ✓ project ${projectId}`);

  console.log(`→ createEnvironment × ${ENVIRONMENTS.length}`);
  for (const e of ENVIRONMENTS) {
    try {
      await inf.createEnvironment(projectId, e);
      console.log(`  ✓ env "${e.slug}"`);
    } catch (err) {
      console.warn(`  ⚠ env "${e.slug}" skipped: ${(err as Error).message.split('\n')[0]}`);
    }
  }

  console.log(`→ seed placeholder secrets × ${STANDARD_SECRETS.length} × ${ENVIRONMENTS.length}`);
  for (const e of ENVIRONMENTS) {
    for (const key of STANDARD_SECRETS) {
      try {
        await inf.createSecret(
          projectId,
          e.slug,
          key,
          '',
          'Заполни через UI или `infisical secrets set`',
        );
      } catch {
        // existing secret or other — skip silently
      }
    }
  }
  console.log('  ✓ placeholders разложены');

  const identityName = `${args.site}-prod-deploy`;
  console.log(`→ createIdentity(${identityName})`);
  const identityId = await inf.createIdentity(identityName, env.orgId);
  console.log(`  ✓ identity ${identityId}`);

  console.log('→ attachUniversalAuth');
  const prodClientId = await inf.attachUniversalAuth(identityId);
  console.log(`  ✓ clientId ${prodClientId}`);

  console.log('→ createClientSecret');
  const prodClientSecret = await inf.createClientSecret(identityId, `${args.site} prod-deploy`);
  console.log('  ✓ clientSecret получен');

  console.log('→ addIdentityToProject');
  try {
    await inf.addIdentityToProject(projectId, identityId, 'no-access');
    console.log('  ✓ identity attached');
  } catch (err) {
    console.warn(`  ⚠ addIdentityToProject failed: ${(err as Error).message.split('\n')[0]}`);
    console.warn('    → fallback: добавь identity к project вручную через UI:');
    console.warn(
      `    ${env.hostUrl}/project/${projectId}/access-management → Add Machine Identity → ${identityName}`,
    );
  }

  const infisicalJson = {
    workspaceId: projectId,
    defaultEnvironment: 'dev',
  };
  const outPath = join(args.outDir, '.infisical.json');
  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(infisicalJson, null, 2) + '\n');
  console.log(`  ✓ .infisical.json → ${outPath}`);

  console.log('\n──────────────────────────────────────────────');
  console.log('PROD MACHINE IDENTITY CREATED:');
  console.log(`  Client ID:     ${prodClientId}`);
  console.log(`  Client Secret: ${prodClientSecret}`);
  console.log('  (Client Secret показывается ОДИН раз — сохрани сейчас!)');
  console.log('');
  console.log('Положи на VPS:');
  console.log('  sudo install -d -m 700 -o deploy -g deploy /etc/infisical');
  console.log(`  echo "${prodClientId}" | sudo tee /etc/infisical/client-id > /dev/null`);
  console.log(`  echo "${prodClientSecret}" | sudo tee /etc/infisical/client-secret > /dev/null`);
  console.log('  sudo chmod 600 /etc/infisical/*');
  console.log('  sudo chown deploy:deploy /etc/infisical/*');
  console.log('');
  console.log('Дальше:');
  console.log('  1. Заполни секреты dev env: через UI или `infisical secrets set --env=dev`');
  console.log('  2. ./dev-setup.sh   (поднимает MinIO + локальный стек)');
  console.log('  3. ./dev.sh         (infisical run --env=dev --recursive -- pnpm dev)');
  if (args.type === 'minimal') {
    console.log('  4. После того как CMS поднялась: pnpm seed:minimal');
  }
  console.log('──────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('\nFATAL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
