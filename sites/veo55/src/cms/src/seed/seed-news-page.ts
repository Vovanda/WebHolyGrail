/**
 * seed-news-page — создаёт страницу /news (slug='news') с placeholder-наполнением.
 *
 * Структура: Hero + Prose со ссылкой на VK + WaveDivider. Реальная лента из VK
 * подтянется в F-этапе (VkPostsAdapter + SocialFeed блок), пока — заглушка
 * чтобы маршрут не возвращал 404 и был наполнен бренд-голосом.
 *
 * Идемпотентен: если страница уже есть — обновляет блоки и сохраняет slug.
 *
 * Запуск: pnpm --filter veo55-cms seed:news-page
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

/**
 * /news = один блок `social-feed`. Заголовок «Новости и события питомника»,
 * подзаголовок и VK-чип отрисовывает сам блок (1:1 с legacy `news.php`).
 * Фильтр-чипы «Все / 🏆 За неделю / 🏆 За месяц» включены по умолчанию.
 *
 * Посты в коллекции `posts` наполняются через `pnpm sync:vk-posts` —
 * запускать руками или повесить на cron (см. session/active).
 */
const newsPageBlocks = [
  {
    blockType: 'social-feed' as const,
    sources: ['vk'],
    count: 30,
    hideLatest: 2,
    showFilters: true,
    weekTopN: 3,
    monthTopN: 10,
    hideTagRegex: '#эксклюз',
  },
];

async function main() {
  console.log('[seed:news-page] starting…');
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'news' } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs.length > 0) {
    const page = existing.docs[0]!;
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        title: 'Новости',
        blocks: newsPageBlocks,
        _status: 'published',
      } as never,
      draft: false,
    });
    console.log(`[seed:news-page] обновил existing page id=${page.id}.`);
  } else {
    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Новости',
        slug: 'news',
        blocks: newsPageBlocks,
        _status: 'published',
      } as never,
    });
    console.log(`[seed:news-page] создал page id=${created.id}.`);
  }

  console.log('[seed:news-page] OK.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:news-page] FAILED:', err);
  process.exit(1);
});
