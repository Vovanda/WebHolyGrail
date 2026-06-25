#!/usr/bin/env tsx
/**
 * Seed: minimal — первый admin + пустая home Page.
 *
 * Идемпотентно: повторный запуск не дублирует, существующие записи остаются.
 *
 * Env:
 *   SEED_ADMIN_EMAIL     (default: admin@example.com)
 *   SEED_ADMIN_PASSWORD  (required при первом запуске; для существующего admin игнорируется)
 *   SEED_ADMIN_NAME      (default: Admin)
 *
 * Запуск (через корневой wrapper):
 *   pnpm seed:minimal
 *
 * Прямой запуск (внутри cms workspace):
 *   pnpm --filter cms exec tsx src/seed/minimal/index.ts
 */

import { getPayload } from 'payload';
import config from '../../payload.config.js';

import { createInitialAdmin } from './createInitialAdmin.js';
import { createHomePage } from './createHomePage.js';

async function main(): Promise<void> {
  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@example.com';
  const password = process.env['SEED_ADMIN_PASSWORD'];
  const name = process.env['SEED_ADMIN_NAME'] ?? 'Admin';

  if (!password) {
    console.error('ERROR: SEED_ADMIN_PASSWORD env required');
    console.error('  example: SEED_ADMIN_PASSWORD="$(openssl rand -hex 16)" pnpm seed:minimal');
    process.exit(1);
  }

  console.log('→ booting Payload...');
  const payload = await getPayload({ config });

  console.log(`→ createInitialAdmin(${email})`);
  const admin = await createInitialAdmin(payload, { email, password, name });
  console.log(
    admin.created
      ? `  ✓ admin created (id ${admin.id})`
      : `  · admin already exists (id ${admin.id})`,
  );

  console.log('→ createHomePage(slug=home)');
  const home = await createHomePage(payload);
  console.log(
    home.created
      ? `  ✓ home page created (id ${home.id})`
      : `  · home page already exists (id ${home.id})`,
  );

  console.log('\nDone. CMS: http://localhost:3001/admin');
  console.log('Login: ' + email);
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFATAL:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
