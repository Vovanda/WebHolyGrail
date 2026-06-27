#!/usr/bin/env tsx
/**
 * Seed: faq — три группы FAQ (Бизнесу / Разработчикам / Технологии) +
 * страница /faq с блоком faq-accordion.
 *
 * Идемпотентно: повторный запуск не дублирует.
 *
 * Env:
 *   SEED_FORCE_FAQ=1       — перезаписать группы (если уже есть).
 *   SEED_FORCE_FAQ_PAGE=1  — перезаписать блоки страницы /faq.
 *
 * Запуск:
 *   pnpm seed:faq
 */

import { getPayload } from 'payload';
import config from '../../payload.config.js';
import { createFaqGroups } from './createFaqGroups.js';
import { createFaqPage } from './createFaqPage.js';
import { addFaqToMainNav } from './addToMainNav.js';

async function main(): Promise<void> {
  console.log('→ booting Payload...');
  const payload = await getPayload({ config });

  console.log('→ createFaqGroups()');
  const groupsResult = await createFaqGroups(payload);
  console.log(
    `  ✓ groups: created=${groupsResult.created}, updated=${groupsResult.updated}, skipped=${groupsResult.skipped}`,
  );

  console.log('→ createFaqPage(slug=faq)');
  const pageResult = await createFaqPage(payload, groupsResult.ids);
  console.log(
    pageResult.created
      ? `  ✓ /faq created/updated (id ${pageResult.id})`
      : `  · /faq already populated (id ${pageResult.id})`,
  );

  console.log('→ addFaqToMainNav()');
  const navResult = await addFaqToMainNav(payload);
  console.log(
    navResult.added
      ? `  ✓ /faq added to mainNav (total items: ${navResult.total})`
      : `  · /faq already in mainNav (total items: ${navResult.total})`,
  );

  console.log('\nDone. Open: http://localhost:3000/faq');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFATAL:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
