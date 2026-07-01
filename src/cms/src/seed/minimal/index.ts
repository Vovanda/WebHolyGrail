#!/usr/bin/env tsx
/**
 * Seed: minimal — стартовый контент (home Page + Media + SiteSettings).
 *
 * @remarks
 * **Admin creation — через UI**, не через seed. Когда нет ни одного пользователя
 * с ролью admin, Payload автоматически показывает на /admin first-user wizard
 * (email + password + подтверждение). Это правильный flow для template:
 * downstream-разработчик клонирует, поднимает dev, открывает /admin, создаёт
 * себе админа с известным ему паролем — без передачи дефолт-кредов.
 *
 * Опционально admin можно создать через seed (для CI / автотестов где UI
 * недоступен): задать ADMIN_INITIAL_PASSWORD env. ADMIN_FORCE_PASSWORD=1 —
 * пересоздать пароль существующего admin (рекомендуется только в dev).
 *
 * Env (канон — `ADMIN_INITIAL_*`, совпадает с Dockerfile/Infisical/bootstrap):
 *   ADMIN_INITIAL_EMAIL           (default: admin@example.com)
 *   ADMIN_INITIAL_PASSWORD        (если не задан — admin не создаётся, юзер
 *                                   получит first-user wizard в /admin)
 *   ADMIN_INITIAL_NAME            (default: Admin)
 *   ADMIN_FORCE_PASSWORD=1        (force-update password существующего admin)
 *   SEED_FORCE_HOME=1             (force-update home page даже если контент есть)
 *
 * Deprecated fallback (для локального dev — читаются если ADMIN_INITIAL_* пусты):
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME, SEED_FORCE_ADMIN_PASSWORD
 *
 * Идемпотентно: повторный запуск не дублирует, существующие записи остаются.
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
import { createFaqGroups } from './createFaqGroups.js';
import { createFaqPage } from './createFaqPage.js';
import { addFaqToMainNav } from './addFaqToMainNav.js';

async function main(): Promise<void> {
  const email =
    process.env['ADMIN_INITIAL_EMAIL'] ?? process.env['SEED_ADMIN_EMAIL'] ?? 'admin@example.com';
  const password = process.env['ADMIN_INITIAL_PASSWORD'] ?? process.env['SEED_ADMIN_PASSWORD'];
  const name = process.env['ADMIN_INITIAL_NAME'] ?? process.env['SEED_ADMIN_NAME'] ?? 'Admin';
  const forcePassword =
    process.env['ADMIN_FORCE_PASSWORD'] === '1' || process.env['SEED_FORCE_ADMIN_PASSWORD'] === '1';

  console.log('→ booting Payload...');
  const payload = await getPayload({ config });

  if (password) {
    console.log(`→ createInitialAdmin(${email})`);
    const admin = await createInitialAdmin(payload, { email, password, name });
    if (admin.created) {
      console.log(`  ✓ admin created (id ${admin.id})`);
    } else if (forcePassword) {
      console.log(`  ✓ admin password updated (id ${admin.id})`);
    } else {
      console.log(`  · admin already exists (id ${admin.id}), password not changed`);
    }
  } else {
    console.log('→ skip admin creation (no ADMIN_INITIAL_PASSWORD)');
    console.log('  Open /admin — Payload покажет first-user wizard если admin ещё нет.');
  }

  console.log('→ createHomePage(slug=home)');
  const home = await createHomePage(payload);
  console.log(
    home.created
      ? `  ✓ home page created (id ${home.id})`
      : `  · home page already exists (id ${home.id})`,
  );

  console.log('→ createFaqGroups()');
  const groups = await createFaqGroups(payload);
  console.log(
    `  ✓ faq groups: created=${groups.created}, updated=${groups.updated}, skipped=${groups.skipped}`,
  );

  console.log('→ createFaqPage(slug=faq)');
  const faqPage = await createFaqPage(payload, groups.ids);
  console.log(
    faqPage.created
      ? `  ✓ /faq created/updated (id ${faqPage.id})`
      : `  · /faq already populated (id ${faqPage.id})`,
  );

  console.log('→ addFaqToMainNav()');
  const nav = await addFaqToMainNav(payload);
  console.log(
    nav.added
      ? `  ✓ /faq added to mainNav (total: ${nav.total})`
      : `  · /faq already in mainNav (total: ${nav.total})`,
  );

  console.log('\nDone. CMS: http://localhost:3001/admin');
  if (password) {
    console.log('Login: ' + email);
  } else {
    console.log('First-user wizard ждёт на /admin (создай админа через UI).');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFATAL:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
