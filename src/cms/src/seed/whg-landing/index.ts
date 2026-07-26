#!/usr/bin/env tsx
/**
 * Seed: whg-landing — витрина самого Web Holy Grail (лендинг + FAQ + брендинг).
 *
 * @remarks
 * Гоняется **только на whg.sawking.tech**. Новому сайту этот контент не нужен —
 * там `seed:minimal` с нейтральной пустой главной (#72). Правило: хардкод WHG
 * допустим только на собственной главной WHG; на стороннем сайте от движка
 * остаётся лишь подпись «Built on Web Holy Grail» в футере.
 *
 * Что ставит:
 *  - initial admin (та же логика что в minimal — переиспользуем),
 *  - SiteSettings движка: siteName, логотип, mainNav, контакты, тема,
 *  - главную-лендинг со всеми блоками,
 *  - FAQ-группы про движок, страницу /faq и пункт в меню.
 *
 * Env — те же `ADMIN_INITIAL_*` что у minimal, плюс force-флаги:
 *   SEED_FORCE_HOME=1       перезаписать лендинг даже если блоки уже есть
 *   SEED_FORCE_FAQ=1        перезаписать существующие FAQ-группы
 *   SEED_FORCE_FAQ_PAGE=1   перезаписать блоки страницы /faq
 *
 * Идемпотентно: повторный запуск не дублирует, правки из админки не затирает.
 *
 * Запуск (через корневой wrapper):
 *   pnpm seed:whg-landing
 *
 * Прямой запуск (внутри cms workspace):
 *   pnpm --filter cms exec tsx src/seed/whg-landing/index.ts
 */

import { getPayload } from 'payload';
import config from '../../payload.config.js';

import { createInitialAdmin } from '../minimal/createInitialAdmin.js';
import { createLandingPage } from './createLandingPage.js';
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

  console.log('→ createLandingPage(slug=home)');
  const home = await createLandingPage(payload);
  console.log(
    home.created
      ? `  ✓ landing page created (id ${home.id})`
      : `  · landing page already exists (id ${home.id})`,
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
