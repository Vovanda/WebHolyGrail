/**
 * seed-rename-litter-page — одноразовый: переименовывает существующую
 * Pages-запись с `slug=litera-n-2026` в `slug=puppies/litera-n-2026`
 * (привести к общему URL-плану `/puppies/<slug>`).
 *
 * Идемпотентен: если страницы с старым слагом нет — пропускает.
 *
 * Запуск: pnpm --filter veo55-cms seed:rename-litter-page
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

async function main() {
  console.log('[seed:rename-litter-page] starting…');
  const payload = await getPayload({ config });

  const oldSlug = 'litera-n-2026';
  const newSlug = 'puppies/litera-n-2026';

  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: oldSlug } },
    limit: 1,
    depth: 0,
  });
  const page = found.docs[0];
  if (!page) {
    console.log(`[seed:rename-litter-page] страница со slug=${oldSlug} не найдена — пропускаю.`);
    process.exit(0);
  }

  await payload.update({
    collection: 'pages',
    id: page.id,
    data: { slug: newSlug, _status: 'published' } as never,
    draft: false,
  });
  console.log(`[seed:rename-litter-page] OK. ${oldSlug} → ${newSlug}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:rename-litter-page] FAILED:', err);
  process.exit(1);
});
