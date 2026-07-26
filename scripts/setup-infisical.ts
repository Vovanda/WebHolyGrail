#!/usr/bin/env tsx
/**
 * setup-infisical.ts — bootstrap нового Holy Grail сайта на self-host Infisical.
 *
 * Делает через REST (native fetch — без SDK для consistency):
 *  1. Login admin Universal Auth identity → accessToken
 *  2. Create project `holygrail-<slug>`
 *  3. Create environments dev / staging / prod
 *  4. Seed placeholder secrets во все env
 *  4b. `--from-env <file>` — залить значения секретов в env `--env` (default prod)
 *  5. Create service identity `<slug>-prod-deploy`
 *  6. Attach Universal Auth к identity
 *  7. Create client secret для identity
 *  8. Add identity к project с role
 *  9. Write `.infisical.json`
 * 10. Print Client ID + Client Secret для VPS
 * 11. `--github` — CI-ключ, его авторизация на VPS, vars/secrets репозитория
 *
 * Запуск:
 *   pnpm setup-infisical -- --site <slug>
 *   pnpm setup-infisical -- --site <slug> --from-env .env.production --env prod
 *   pnpm setup-infisical -- --site <slug> --github --vps-host <ip> --domain <host> --port-base 3020
 *
 * Env (обязательно):
 *   INFISICAL_HOST_URL              — URL self-host instance (https://infisical.example.com)
 *   INFISICAL_ADMIN_CLIENT_ID       — admin UA client ID (из `infisical bootstrap`)
 *   INFISICAL_ADMIN_CLIENT_SECRET   — admin UA client secret
 *   INFISICAL_ADMIN_ORG_ID          — orgId (из `infisical bootstrap` output)
 *
 * Документация:
 *   - `.claude/skills/whg-infisical/SKILL.md` — workflow для агента
 *   - `docs/stack/infisical.md` — стек, версии, инструменты
 *   - `docs/whg/37-scaffolding.md` — human-readable scaffold guide
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

interface Args {
  site: string;
  outDir: string;
  type: string;
  fromEnv?: string;
  onlyEnv: string;
  github: boolean;
  domain?: string;
  vpsHost?: string;
  vpsUser: string;
  portBase: string;
  repo?: string;
  sshKey?: string;
}

interface AdminEnv {
  hostUrl: string;
  orgId: string;
  // Two auth modes: either a pre-issued admin token (from `infisical bootstrap`)
  // or Universal Auth client credentials. Token wins if both present.
  token?: string;
  clientId?: string;
  clientSecret?: string;
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
  // Первый вход в админку. compose требует их через `:?` — без значений
  // prod-стек не поднимается вообще.
  'ADMIN_INITIAL_EMAIL',
  'ADMIN_INITIAL_PASSWORD',
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
      'from-env': { type: 'string' },
      env: { type: 'string', default: 'prod' },
      github: { type: 'boolean', default: false },
      domain: { type: 'string' },
      'vps-host': { type: 'string' },
      'vps-user': { type: 'string', default: 'deploy' },
      'port-base': { type: 'string', default: '3000' },
      repo: { type: 'string' },
      'ssh-key': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help || !values.site) {
    console.error(
      'Usage: pnpm setup-infisical -- --site <slug> [--type minimal|business-card|blog|portal]',
    );
    console.error('  --site <slug>      site identifier (e.g. "my-site")');
    console.error('  --type <preset>    project type preset (default: minimal)');
    console.error('  --out-dir <path>   where to write .infisical.json (default: .)');
    console.error('  --from-env <file>   fill secret values from an .env file');
    console.error('  --env <slug>        target environment for --from-env (default: prod)');
    console.error('');
    console.error('GitHub deploy (--github, requires gh CLI):');
    console.error('  --vps-host <ip>     production VPS — required with --github');
    console.error('  --domain <host>     production domain — required with --github');
    console.error('  --vps-user <user>   ssh user on the VPS (default: deploy)');
    console.error('  --port-base <n>     3000 / 3020 / 3040 — one slot per site (default: 3000)');
    console.error('  --repo <owner/repo> repository (default: origin of the current folder)');
    console.error('  --ssh-key <path>    existing CI key instead of generating one');
    console.error('');
    console.error('Required env:');
    console.error('  INFISICAL_HOST_URL              self-host URL');
    console.error('  INFISICAL_ADMIN_CLIENT_ID       admin UA client ID');
    console.error('  INFISICAL_ADMIN_CLIENT_SECRET   admin UA client secret');
    console.error('  INFISICAL_ADMIN_ORG_ID          org ID');
    process.exit(values.help ? 0 : 1);
  }

  if (values.github) {
    const missing = [
      ...(values['vps-host'] ? [] : ['--vps-host']),
      ...(values.domain ? [] : ['--domain']),
    ];
    if (missing.length > 0) {
      console.error(`ERROR: --github requires ${missing.join(' and ')}`);
      process.exit(1);
    }
  }

  return {
    site: values.site as string,
    outDir: resolve(values['out-dir'] ?? '.'),
    type: values.type as string,
    fromEnv: values['from-env'] ? resolve(values['from-env']) : undefined,
    onlyEnv: values.env as string,
    github: values.github === true,
    domain: values.domain,
    vpsHost: values['vps-host'],
    vpsUser: values['vps-user'] as string,
    portBase: values['port-base'] as string,
    repo: values.repo,
    sshKey: values['ssh-key'] ? resolve(values['ssh-key']) : undefined,
  };
}

/**
 * Читает KEY=VALUE из .env-файла. Ровно то подмножество синтаксиса, которое
 * понимает `docker compose --env-file`: без подстановок, без multiline.
 * Пустые значения возвращаются тоже — вызывающий решает, лить их или нет.
 */
function parseEnvFile(path: string): Map<string, string> {
  if (!existsSync(path)) {
    console.error(`ERROR: --from-env file not found: ${path}`);
    process.exit(1);
  }
  const out = new Map<string, string>();
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Снимаем обрамляющие кавычки — compose их тоже не считает частью значения.
    if (value.length > 1 && /^(".*"|'.*')$/.test(value)) value = value.slice(1, -1);
    out.set(key, value);
  }
  return out;
}

function run(cmd: string, argv: string[], input?: string): string {
  return execFileSync(cmd, argv, {
    encoding: 'utf8',
    ...(input === undefined ? { stdio: ['ignore', 'pipe', 'pipe'] as const } : { input }),
  }).trim();
}

/** Одинарные кавычки для remote shell: значение уезжает в ssh как есть. */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/** Ключ отдельный на сайт: отзывается независимо от личного ключа разработчика. */
function ensureCiKey(args: Args): { privatePath: string; publicKey: string } {
  const privatePath = args.sshKey ?? join(homedir(), '.ssh', `ci-${args.site}`);
  const publicPath = `${privatePath}.pub`;

  if (existsSync(privatePath)) {
    console.log(`  · key already exists: ${privatePath}`);
  } else {
    mkdirSync(dirname(privatePath), { recursive: true });
    run('ssh-keygen', [
      '-t',
      'ed25519',
      '-f',
      privatePath,
      '-N',
      '',
      '-C',
      `gh-actions@${args.site}`,
      '-q',
    ]);
    console.log(`  ✓ key created: ${privatePath}`);
  }

  if (!existsSync(publicPath)) {
    throw new Error(`public half of the key is missing: ${publicPath}`);
  }
  return { privatePath, publicKey: readFileSync(publicPath, 'utf8').trim() };
}

/**
 * Кладёт публичный ключ в authorized_keys. Не через `ssh-copy-id`: он есть не на
 * каждой платформе и проверяет доступ любым ключом из `~/.ssh/config` — успешно
 * логинится чужим и пропускает установку нового.
 */
function authorizeKeyOnVps(args: Args, publicKey: string): void {
  const target = `${args.vpsUser}@${args.vpsHost}`;
  const quoted = shellQuote(publicKey);
  const remote = [
    'mkdir -p ~/.ssh',
    'chmod 700 ~/.ssh',
    'touch ~/.ssh/authorized_keys',
    'chmod 600 ~/.ssh/authorized_keys',
    `grep -qxF ${quoted} ~/.ssh/authorized_keys || echo ${quoted} >> ~/.ssh/authorized_keys`,
    'grep -c . ~/.ssh/authorized_keys',
  ].join(' && ');

  const keyCount = run('ssh', ['-o', 'ConnectTimeout=20', '-o', 'BatchMode=yes', target, remote]);
  console.log(`  ✓ authorized on ${target} (keys in authorized_keys: ${keyCount})`);
}

function githubDeployConfig(args: Args, infisicalHostUrl: string): void {
  // Наличие vps-host и domain уже проверено в parseArguments.
  const repo =
    args.repo ?? run('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);
  console.log(`→ github deploy config for ${repo}`);

  const { privatePath, publicKey } = ensureCiKey(args);
  authorizeKeyOnVps(args, publicKey);

  run('gh', ['secret', 'set', 'VPS_HOST', '--repo', repo, '--body', args.vpsHost!]);
  run('gh', ['secret', 'set', 'VPS_SSH_KEY', '--repo', repo], readFileSync(privatePath, 'utf8'));
  console.log('  ✓ secrets: VPS_HOST, VPS_SSH_KEY');

  const vars: Array<[string, string]> = [
    ['VPS_USER', args.vpsUser],
    ['VPS_PATH', `/opt/sites/${args.site}`],
    ['PUBLIC_URL', `https://${args.domain}`],
    ['PRIMARY_DOMAIN', args.domain!],
    ['INFISICAL_HOST_URL', infisicalHostUrl],
    ['PORT_BASE', args.portBase],
  ];
  for (const [name, value] of vars) {
    run('gh', ['variable', 'set', name, '--repo', repo, '--body', value]);
  }
  console.log(`  ✓ variables: ${vars.map(([n]) => n).join(', ')}`);
}

function readAdminEnv(): AdminEnv {
  const hostUrl = process.env['INFISICAL_HOST_URL'];
  const orgId = process.env['INFISICAL_ADMIN_ORG_ID'];
  const token = process.env['INFISICAL_ADMIN_TOKEN'];
  const clientId = process.env['INFISICAL_ADMIN_CLIENT_ID'];
  const clientSecret = process.env['INFISICAL_ADMIN_CLIENT_SECRET'];

  const missing: string[] = [];
  if (!hostUrl) missing.push('INFISICAL_HOST_URL');
  if (!orgId) missing.push('INFISICAL_ADMIN_ORG_ID');
  if (!token && !(clientId && clientSecret)) {
    missing.push(
      'INFISICAL_ADMIN_TOKEN (or INFISICAL_ADMIN_CLIENT_ID + INFISICAL_ADMIN_CLIENT_SECRET)',
    );
  }

  if (missing.length > 0) {
    console.error(`ERROR: missing env: ${missing.join(', ')}`);
    console.error('Run `infisical bootstrap` on VPS first, then set env from output.');
    console.error('See docs/stack/infisical.md → "Bootstrap admin identity".');
    process.exit(1);
  }

  return {
    hostUrl: hostUrl!.replace(/\/$/, ''),
    orgId: orgId!,
    token,
    clientId,
    clientSecret,
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

  useToken(token: string): void {
    this.accessToken = token;
  }

  async createProject(slug: string, orgId: string): Promise<{ id: string; reused: boolean }> {
    const projectSlug = `holygrail-${slug}`;
    try {
      const res = await this.fetch('POST', '/api/v2/workspace', {
        projectName: projectSlug,
        slug: projectSlug,
        type: 'secret-manager',
        projectDescription: `Holy Grail site: ${slug}`,
        organizationId: orgId,
      });
      const id = (res as { project?: { id?: string } }).project?.id ?? (res as { id?: string }).id;
      if (!id) throw new Error('createProject: no project id in response');
      return { id, reused: false };
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes('already exists')) throw err;
      // Idempotent: find existing.
      const list = await this.fetch('GET', '/api/v1/workspace');
      const projects =
        (list as { workspaces?: Array<{ id: string; slug: string }> }).workspaces ?? [];
      const found = projects.find((p) => p.slug === projectSlug);
      if (!found)
        throw new Error(
          `createProject: "${projectSlug}" reported as existing but not found in /workspace list`,
        );
      return { id: found.id, reused: true };
    }
  }

  async listEnvironments(
    projectId: string,
  ): Promise<Array<{ id: string; slug: string; name: string }>> {
    const res = await this.fetch('GET', `/api/v1/workspace/${projectId}`);
    return (
      (res as { workspace?: { environments?: Array<{ id: string; slug: string; name: string }> } })
        .workspace?.environments ?? []
    );
  }

  async findIdentity(name: string, orgId: string): Promise<string | null> {
    const res = await this.fetch('GET', `/api/v2/organizations/${orgId}/identity-memberships`);
    const memberships =
      (res as { identityMemberships?: Array<{ identity: { id: string; name: string } }> })
        .identityMemberships ?? [];
    const found = memberships.find((m) => m.identity.name === name);
    return found ? found.identity.id : null;
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

  async listSecrets(projectId: string, envSlug: string): Promise<Map<string, string>> {
    const qs = new URLSearchParams({
      workspaceId: projectId,
      environment: envSlug,
      secretPath: '/',
    });
    const res = await this.fetch('GET', `/api/v3/secrets/raw?${qs}`);
    const secrets =
      (res as { secrets?: Array<{ secretKey: string; secretValue: string }> }).secrets ?? [];
    return new Map(secrets.map((s) => [s.secretKey, s.secretValue]));
  }

  async updateSecret(
    projectId: string,
    envSlug: string,
    key: string,
    value: string,
  ): Promise<void> {
    await this.fetch('PATCH', `/api/v3/secrets/raw/${encodeURIComponent(key)}`, {
      workspaceId: projectId,
      environment: envSlug,
      secretValue: value,
      secretPath: '/',
      type: 'shared',
    });
  }

  /** Значение приезжает независимо от того, разложен ли placeholder этим же прогоном. */
  async upsertSecret(
    projectId: string,
    envSlug: string,
    key: string,
    value: string,
    comment = '',
  ): Promise<'created' | 'updated'> {
    try {
      await this.createSecret(projectId, envSlug, key, value, comment);
      return 'created';
    } catch (err) {
      if (!/already exist/i.test((err as Error).message)) throw err;
      await this.updateSecret(projectId, envSlug, key, value);
      return 'updated';
    }
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

  /**
   * Меняет role у уже attached identity. POST attach hardcoded 'no-access' роль,
   * PATCH её на 'viewer' — минимум прав для чтения secrets через `infisical run`.
   * Без promote `infisical run --token=...` падает с
   *   `403 You are not allowed to describeSecret on secrets`.
   */
  async promoteIdentityRole(
    projectId: string,
    identityId: string,
    role: 'viewer' | 'no-access' | 'admin' | 'member',
  ): Promise<void> {
    await this.fetch('PATCH', `/api/v2/workspace/${projectId}/identity-memberships/${identityId}`, {
      roles: [{ role, isTemporary: false }],
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

  console.log(`\n  Holy Grail — Infisical setup for "${args.site}" (type: ${args.type})`);
  console.log(`  Host: ${env.hostUrl}\n`);

  const inf = new Infisical(env.hostUrl);

  if (env.token) {
    console.log('→ auth: pre-issued admin token');
    inf.useToken(env.token);
  } else {
    console.log('→ auth: Universal Auth login');
    await inf.login(env.clientId!, env.clientSecret!);
  }
  console.log('  ✓ authenticated');

  console.log(`→ createProject(holygrail-${args.site})`);
  const project = await inf.createProject(args.site, env.orgId);
  console.log(
    `  ${project.reused ? '·' : '✓'} project ${project.id}${project.reused ? ' (existing, reused)' : ''}`,
  );
  const projectId = project.id;

  console.log('→ ensureEnvironments dev/staging/prod');
  const existingEnvs = await inf.listEnvironments(projectId);
  const existingSlugs = new Set(existingEnvs.map((e) => e.slug));
  console.log(`  · already present: ${[...existingSlugs].join(', ') || '(none)'}`);
  for (const e of ENVIRONMENTS) {
    if (existingSlugs.has(e.slug)) continue;
    try {
      await inf.createEnvironment(projectId, e);
      console.log(`  ✓ env "${e.slug}" created`);
    } catch (err) {
      console.warn(`  ⚠ env "${e.slug}" failed: ${(err as Error).message.split('\n')[0]}`);
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
          'Fill via setup-infisical --from-env, UI, or `infisical secrets set`',
        );
      } catch {
        // existing secret or other — skip silently
      }
    }
  }
  console.log('  ✓ placeholders seeded');

  // Placeholder'ов мало: пока значения пустые, `deploy.sh` падает на первом же
  // обязательном ключе (`S3_BUCKET is missing a value`), а Web UI для ручного
  // ввода может быть недоступен. Поэтому значения приезжают тем же прогоном.
  if (args.fromEnv) {
    const parsed = parseEnvFile(args.fromEnv);
    const filled = [...parsed].filter(([, v]) => v !== '');
    const skipped = parsed.size - filled.length;
    console.log(
      `→ fillSecrets(${basename(args.fromEnv)} → env "${args.onlyEnv}"): ${filled.length} values` +
        (skipped > 0 ? `, ${skipped} empty skipped` : ''),
    );

    let created = 0;
    let updated = 0;
    const failed: string[] = [];
    for (const [key, value] of filled) {
      try {
        const how = await inf.upsertSecret(
          projectId,
          args.onlyEnv,
          key,
          value,
          `filled from ${basename(args.fromEnv)}`,
        );
        if (how === 'created') created++;
        else updated++;
      } catch (err) {
        failed.push(`${key}: ${(err as Error).message.split('\n')[0]}`);
      }
    }
    console.log(`  ✓ created ${created}, updated ${updated}`);
    for (const f of failed) console.warn(`  ⚠ ${f}`);

    // Пустые ключи после заливки — единственная причина, по которой деплой ещё
    // может упасть на секретах. Называем их сразу, а не в логах деплоя.
    const after = await inf.listSecrets(projectId, args.onlyEnv);
    const stillEmpty = [...after]
      .filter(([, v]) => v === '')
      .map(([k]) => k)
      .sort();
    if (stillEmpty.length > 0) {
      console.warn(`  ⚠ still empty (${stillEmpty.length}): ${stillEmpty.join(', ')}`);
    } else {
      console.log(`  ✓ no empty secrets left in "${args.onlyEnv}"`);
    }
  }

  const identityName = `${args.site}-prod-deploy`;
  console.log(`→ ensureIdentity(${identityName})`);
  let identityId = await inf.findIdentity(identityName, env.orgId);
  let prodClientId: string | null = null;
  let prodClientSecret: string | null = null;

  if (identityId) {
    console.log(
      `  · identity exists ${identityId} (skip create + UA setup; rotate client-secret manually if needed)`,
    );
  } else {
    identityId = await inf.createIdentity(identityName, env.orgId);
    console.log(`  ✓ identity ${identityId}`);

    console.log('→ attachUniversalAuth');
    prodClientId = await inf.attachUniversalAuth(identityId);
    console.log(`  ✓ clientId ${prodClientId}`);

    console.log('→ createClientSecret');
    prodClientSecret = await inf.createClientSecret(identityId, `${args.site} prod-deploy`);
    console.log('  ✓ clientSecret received');

    console.log('→ addIdentityToProject (attach as no-access, then promote)');
    try {
      await inf.addIdentityToProject(projectId, identityId, 'no-access');
      console.log('  ✓ identity attached');
    } catch (err) {
      console.warn(`  ⚠ addIdentityToProject failed: ${(err as Error).message.split('\n')[0]}`);
      console.warn('    → fallback: add the identity to the project manually via UI:');
      console.warn(
        `    ${env.hostUrl}/project/${projectId}/access-management → Add Machine Identity → ${identityName}`,
      );
    }

    console.log('→ promoteIdentityRole(no-access → viewer)');
    try {
      await inf.promoteIdentityRole(projectId, identityId, 'viewer');
      console.log('  ✓ role: viewer');
    } catch (err) {
      console.warn(`  ⚠ promoteIdentityRole failed: ${(err as Error).message.split('\n')[0]}`);
      console.warn('    → fallback: PATCH the role manually:');
      console.warn(
        `    curl -X PATCH "${env.hostUrl}/api/v2/workspace/${projectId}/identity-memberships/${identityId}" -d '{"roles":[{"role":"viewer"}]}'`,
      );
    }
  }

  const infisicalJson = {
    workspaceId: projectId,
    defaultEnvironment: 'dev',
  };
  const outPath = join(args.outDir, '.infisical.json');
  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(infisicalJson, null, 2) + '\n');
  console.log(`  ✓ .infisical.json → ${outPath}`);

  // Без этого блока автодеплой не поднимется: GitHub не копирует переменные
  // окружения template-репо, у свежего инстанса их нет.
  if (args.github) {
    githubDeployConfig(args, env.hostUrl);
  }

  console.log('\n──────────────────────────────────────────────');
  if (prodClientId && prodClientSecret) {
    console.log('PROD MACHINE IDENTITY CREATED:');
    console.log(`  Client ID:     ${prodClientId}`);
    console.log(`  Client Secret: ${prodClientSecret}`);
    console.log('  (Client Secret is shown ONCE — save it now!)');
    console.log('');
    console.log('Put on the VPS:');
    console.log(`  sudo install -d -m 700 -o deploy -g deploy /etc/infisical/${args.site}`);
    console.log(
      `  echo "${prodClientId}"     | sudo tee /etc/infisical/${args.site}/client-id     > /dev/null`,
    );
    console.log(
      `  echo "${prodClientSecret}" | sudo tee /etc/infisical/${args.site}/client-secret > /dev/null`,
    );
    console.log(`  sudo chmod 600 /etc/infisical/${args.site}/*`);
    console.log(`  sudo chown deploy:deploy /etc/infisical/${args.site}/*`);
  } else {
    console.log(`PROD MACHINE IDENTITY EXISTS (${identityId})`);
    console.log(
      '  Client Secret is not shown again — use the existing one from /etc/infisical/' +
        args.site +
        '/',
    );
    console.log('  If lost: rotate via UI, or delete the identity and re-run the scaffold.');
  }
  console.log('');
  if (!args.github) {
    console.log('Production deploy needs repo vars/secrets — re-run with:');
    console.log(
      `  pnpm setup-infisical -- --site ${args.site} --github --vps-host <ip> --domain <host> --port-base <n>`,
    );
    console.log('');
  }
  console.log('Next:');
  console.log(
    '  1. Fill dev secrets: `./dev-setup.sh` does it, or `infisical secrets set --env=dev`',
  );
  console.log('  2. ./dev-setup.sh   (MinIO + local stack)');
  console.log('  3. ./dev.sh         (infisical run --env=dev --recursive -- pnpm dev)');
  if (args.type === 'minimal') {
    console.log('  4. Once the CMS is up: pnpm seed:minimal');
  }
  console.log('──────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('\nFATAL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
