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

const newsPageBlocks = [
  {
    blockType: 'hero' as const,
    title: 'Новости {accent}',
    titleAccent: 'питомника',
    subtitle: 'Жизнь собак, прогулки, выставки, помёты',
    subtitleShort: 'Жизнь питомника',
  },
  {
    blockType: 'prose' as const,
    body:
      'Мы делимся жизнью собак в нашем VK-сообществе — фотографии прогулок, ' +
      'выставочные результаты, обновления по щенкам, рабочие занятия по ОКД и ЗКС.' +
      '\n\n' +
      'Полная лента публикуется на нашей странице VK. В ближайшее время мы перенесём её сюда, ' +
      'чтобы новости были видны прямо на сайте — без переходов и регистрации.' +
      '\n\n' +
      'А пока — заходите в группу: https://vk.com/veo55omsk',
    variant: 'editorial-with-dropcap' as const,
  },
  {
    blockType: 'wave-divider' as const,
    flipped: false,
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
