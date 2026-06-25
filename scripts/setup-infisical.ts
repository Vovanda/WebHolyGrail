#!/usr/bin/env tsx
/**
 * setup-infisical.ts — bootstrap нового Holy Grail сайта в Infisical Cloud.
 *
 * @remarks
 * Создаёт project + 3 environments (dev/staging/prod) + machine identity для
 * prod-деплоя + seed placeholders известных секретов + пишет
 * `.infisical.json` в корень репо.
 *
 * Запуск:
 *   pnpm setup-infisical -- --site <slug> [--org-id <orgId>]
 *
 * Пример:
 *   pnpm setup-infisical -- --site sawking-tech --org-id abc-def-123
 *
 * Prerequisites:
 *   - Infisical Cloud аккаунт (https://app.infisical.com — бесплатный tier хватает)
 *   - `infisical login` (один раз) — сохраняет токен в keychain
 *   - Слот в Org (orgId передаётся флагом или INFISICAL_ORG_ID env)
 *
 * Output:
 *   - Project ID и Client ID + Client Secret для prod-identity. Их надо
 *     положить на VPS в `/etc/infisical/client-id`, `/etc/infisical/client-secret`
 *     (chmod 600 deploy:deploy). Дальнейший `deploy.sh` `infisical login
 *     --method=universal-auth` подхватит.
 *
 * Документация:
 *   - https://infisical.com/docs/sdks/languages/node
 *   - https://infisical.com/blog/introducing-machine-identities
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { InfisicalSDK } from '@infisical/sdk';

interface Args {
  site: string;
  orgId: string;
  apiUrl: string;
  authMethod: 'browser' | 'universal-auth';
  outDir: string;
}

function parseArguments(): Args {
  const { values } = parseArgs({
    options: {
      site: { type: 'string', short: 's' },
      'org-id': { type: 'string' },
      'api-url': { type: 'string', default: 'https://app.infisical.com' },
      'auth-method': { type: 'string', default: 'browser' },
      'out-dir': { type: 'string', default: '.' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
  });

  if (values.help || !values.site) {
    console.error('Usage: pnpm setup-infisical -- --site <slug> [--org-id <id>]');
    console.error('  --site <slug>       site identifier (e.g. "sawking-tech")');
    console.error('  --org-id <id>       Infisical org id (or INFISICAL_ORG_ID env)');
    console.error('  --api-url <url>     Infisical API base URL (default: app.infisical.com)');
    console.error('  --auth-method       browser | universal-auth (default: browser)');
    console.error('  --out-dir <path>    where to write .infisical.json (default: .)');
    process.exit(values.help ? 0 : 1);
  }

  const orgId = values['org-id'] ?? process.env['INFISICAL_ORG_ID'];
  if (!orgId) {
    console.error('ERROR: --org-id or INFISICAL_ORG_ID env required');
    process.exit(1);
  }

  return {
    site: values.site as string,
    orgId,
    apiUrl: values['api-url'] as string,
    authMethod: (values['auth-method'] ?? 'browser') as 'browser' | 'universal-auth',
    outDir: resolve(values['out-dir'] ?? '.'),
  };
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

async function loginInteractive(client: InfisicalSDK): Promise<void> {
  // Universal-auth через env (для CI) или браузерный flow (для dev-machine).
  const clientId = process.env['INFISICAL_CLIENT_ID'];
  const clientSecret = process.env['INFISICAL_CLIENT_SECRET'];

  if (clientId && clientSecret) {
    console.log('→ Auth: universal-auth (INFISICAL_CLIENT_ID/SECRET env)');
    await client.auth().universalAuth.login({ clientId, clientSecret });
    return;
  }

  console.log('→ Auth: токен из локального `infisical login` (keychain).');
  console.log('  Если не залогинен: запусти `infisical login` в отдельном терминале.');
  const token = process.env['INFISICAL_TOKEN'];
  if (!token) {
    console.error('ERROR: INFISICAL_TOKEN env not set, run `infisical login` first');
    console.error('  or pass INFISICAL_CLIENT_ID + INFISICAL_CLIENT_SECRET for CI');
    process.exit(1);
  }
  client.auth().accessToken(token);
}

async function main(): Promise<void> {
  const args = parseArguments();
  console.log(`\n  Holy Grail — Infisical setup для "${args.site}"\n`);

  const client = new InfisicalSDK({ siteUrl: args.apiUrl });
  await loginInteractive(client);

  const projectName = `holygrail-${args.site}`;
  const projectSlug = projectName;

  // 1. Project
  console.log(`→ createProject(${projectName})`);
  const project = await client.projects().create({
    projectName,
    type: 'secret-manager',
    projectDescription: `Holy Grail site: ${args.site}`,
    slug: projectSlug,
  });
  const projectId = (project as { id?: string; project?: { id: string } }).id
    ?? (project as { project?: { id: string } }).project?.id;
  if (!projectId) throw new Error('createProject не вернул id');
  console.log(`  ✓ project ${projectId}`);

  // 2. Environments
  const envs = [
    { name: 'Development', slug: 'dev', position: 1 },
    { name: 'Staging', slug: 'staging', position: 2 },
    { name: 'Production', slug: 'prod', position: 3 },
  ];
  console.log(`→ createEnvironment × ${envs.length}`);
  for (const env of envs) {
    try {
      await client.environments().create({ ...env, projectId });
      console.log(`  ✓ env "${env.slug}"`);
    } catch (e) {
      console.warn(`  ⚠ env "${env.slug}" уже существует или ошибка: ${(e as Error).message}`);
    }
  }

  // 3. Seed placeholder secrets во ВСЕ env
  console.log(`→ seed placeholder secrets × ${STANDARD_SECRETS.length}`);
  for (const env of envs) {
    for (const key of STANDARD_SECRETS) {
      try {
        await client.secrets().createSecret(key, {
          environment: env.slug,
          projectId,
          secretValue: '',
          secretComment: 'Заполни через Infisical UI или `infisical secrets set`',
          secretPath: '/',
        });
      } catch {
        // Already exists or другая ошибка — skip
      }
    }
  }
  console.log('  ✓ placeholders разложены');

  // 4. .infisical.json — линк репо к проекту
  const infisicalJson = {
    workspaceId: projectId,
    defaultEnvironment: 'dev',
  };
  const outPath = join(args.outDir, '.infisical.json');
  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(infisicalJson, null, 2) + '\n');
  console.log(`  ✓ .infisical.json → ${outPath}`);

  // 5. Hint про machine identity (SDK не всегда поддерживает createIdentity напрямую;
  // в текущей версии надо завести через UI или Terraform-провайдер).
  console.log('\n──────────────────────────────────────────────');
  console.log('Готово. Дальше — вручную через Infisical UI:');
  console.log(`  1. Project "${projectName}" → Access Control → Machine Identities`);
  console.log(`  2. Create identity "${args.site}-prod-deploy" с Universal Auth.`);
  console.log('  3. Привязать identity к environment "prod" с правами Read.');
  console.log('  4. Сгенерировать Client ID + Client Secret.');
  console.log('  5. На VPS:');
  console.log('     sudo install -d -m 700 -o deploy -g deploy /etc/infisical');
  console.log('     echo "<client-id>" | sudo tee /etc/infisical/client-id > /dev/null');
  console.log('     echo "<client-secret>" | sudo tee /etc/infisical/client-secret > /dev/null');
  console.log('     sudo chmod 600 /etc/infisical/*');
  console.log('     sudo chown deploy:deploy /etc/infisical/*');
  console.log('──────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
