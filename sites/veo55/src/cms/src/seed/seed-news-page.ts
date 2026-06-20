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
 * Контент сверен с legacy `veo55.ru/news` (`articles/news.html` →
 * `.veo-news__hd`): h1 «Новости» + подзаголовок «Жизнь питомника…» +
 * круглый чип «Подписаться на VK-группу». У нас «чип» = AchievementBanner
 * (тот же визуальный паттерн: emoji + title + описание + accent), потому что
 * специального CTA-блока нет и второй use-case (R9) не появлялся.
 *
 * **F-этап:** заменить Prose-placeholder на блок `social-feed` который будет
 * рендерить ленту из VK через адаптер VkPostsAdapter и коллекцию Posts.
 * См. `.tmp/legacy/cron-news-db-sync.php` как образец (wall.get → upsert
 * `veo55_news_posts` + `veo55_news_comments`). Media grid 1/2/3/4/5/6+,
 * хэштеги, dog-mentions, комментарии lazy-load — всё это часть F-этапа.
 */
const newsPageBlocks = [
  {
    blockType: 'hero' as const,
    title: '{accent}',
    titleAccent: 'Новости',
    subtitle: 'Жизнь питомника — прогулки, выставки, рабочие занятия по ОКД и ЗКС',
    subtitleShort: 'Жизнь питомника',
  },
  {
    blockType: 'achievement-banner' as const,
    icon: '📰',
    title: 'Лента ВКонтакте',
    titleSuffix: '· vk.com/veoomsk',
    description:
      'Мы публикуем фотографии прогулок, выставочные результаты и обновления по щенкам в нашей VK-группе. Скоро лента появится прямо здесь — пока заходите в группу по ссылке.',
    accent: 'amber',
  },
  {
    blockType: 'prose' as const,
    body:
      'Подписаться: [https://vk.com/veoomsk](https://vk.com/veoomsk)' +
      '\n\n' +
      'Если у вас есть вопрос или вы хотите познакомиться с собаками лично — напишите нам в группу или позвоните по телефону, который указан в подвале сайта.',
    variant: 'editorial-plain' as const,
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
