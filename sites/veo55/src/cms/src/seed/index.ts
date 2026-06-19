import 'dotenv/config';
import { getPayload } from 'payload';

import config from '../payload.config';

/**
 * Seed-скрипт — первичное наполнение БД контентом.
 *
 * @remarks
 * Запуск: `pnpm --filter veo55-cms seed`.
 *
 * Идемпотентен: можно запускать многократно, при существовании сущности с тем же
 * slug обновляет, не создаёт дубликат.
 *
 * **Что засеиваем:**
 *  - SiteSettings (имя, контакты, mainNav, social, theme, layout)
 *  - Главную страницу (slug='') с блоками Hero / Quote / Timeline / Prose / WaveDivider
 *
 * **R0:** после seed контент **в БД**. Дальше клиент правит через админку — изменения
 * остаются. Запуск seed повторно **перезаписывает** только seed-managed поля,
 * пользовательские правки могут пропасть. Поэтому seed — только для первичного
 * наполнения. Маркер `createdBySeed: true` (где доступно) позволяет отличить.
 */
async function main() {
  console.log('[seed] starting…');
  const payload = await getPayload({ config });

  // ── SiteSettings ────────────────────────────────────────────────
  console.log('[seed] SiteSettings…');
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteName: 'Питомник «Омская Дружина»',
      contacts: {
        phone: '+7 908 313 25 49',
        email: 'info@veo55.ru',
        address: 'г. Омск',
      },
      mainNav: [
        { href: '/', label: 'Щенки ВЕО' },
        { href: '/faq', label: 'Ответы на вопросы' },
        { href: '/news', label: 'Новости' },
        { href: '/catalog', label: 'Каталог собак' },
      ],
      social: [{ platform: 'vk', url: 'https://vk.com/veo55', label: 'ВКонтакте' }],
      theme: {
        mode: 'light',
        userToggle: false,
        availableThemes: ['light', 'dark'],
      },
    },
  });

  // ── Главная страница ───────────────────────────────────────────
  console.log('[seed] Pages: главная (slug="home")');
  const existingHome = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  const homeBlocks = [
    {
      blockType: 'hero' as const,
      title: 'Щенки ВЕО с документами РКФ',
      subtitle: 'Питомник «Омская Дружина» · Омск',
    },
    {
      blockType: 'wave-divider' as const,
    },
    {
      blockType: 'quote' as const,
      heading: 'О нас',
      body: 'Я являлась заводчиком восточноевропейских овчарок и основателем питомника ВЕО «Омская Дружина». Моя история с веэо началась более 30 лет назад, когда я ещё девочкой первый раз увидела овчарку — с тех пор я не переставала восхищаться её преданностью, умом и силой духа — с гордой любовью занимаюсь разведением ВЕО.',
      author: 'Савкина Ольга Владимировна',
      role: 'Основатель питомника',
      variant: 'card-accent-left',
    },
    {
      blockType: 'prose' as const,
      body: [
        'В нашем питомнике мы тщательно отбираем производителей: они участвуют в выставках и получают отличные оценки, проходят курсы дрессировки, тесты и ежегодную диспансеризацию.',
        'Все собаки привиты, обработаны от паразитов и проходят регулярные медицинские проверки, прививки прививаются в установленные сроки и в полном соответствии с памяткой ДМ.',
        'Щенки чёрного, зонарного и чепрачного окраса растут в нашем доме, контактны и социализированы. Они получают качественное питание и уход. Все щенки имеют документы РКФ-FCI.',
      ].join('\n\n'),
      variant: 'editorial-with-dropcap',
    },
    {
      blockType: 'wave-divider' as const,
    },
    {
      blockType: 'timeline' as const,
      heading: 'Наш путь',
      entries: [
        {
          year: '2026',
          icon: '🐾',
          body: 'Помёт литера «Н» получил отметку РКФ «Отборное разведение / Selected Breeding» — высший статус, доступный единицам помётов ВЕО в России.',
        },
        {
          year: '2024',
          icon: '🏆',
          body: 'Участвуем в развитии породы на программах России: «Омская Дружина Императрица» восстановила популяцию ВЕО в Великобритании.',
        },
        {
          year: '2022',
          icon: '📜',
          body: 'Наши собаки вышли в рабочий класс — ОКД и ЗКС с высшими отметками.',
        },
      ],
      variant: 'editorial-dots',
    },
  ];

  const homeData = {
    title: 'Главная',
    slug: 'home',
    blocks: homeBlocks,
    seo: {
      title: 'Щенки ВЕО · Питомник «Омская Дружина», Омск',
      description:
        'Питомник восточноевропейской овчарки «Омская Дружина» (Омск). Щенки ВЕО с документами РКФ, отборное разведение, родители-чемпионы.',
    },
    _status: 'published' as const,
  };

  if (existingHome.docs.length > 0) {
    const id = existingHome.docs[0]!.id;
    console.log(`[seed]   exists (id=${id}) — updating`);
    await payload.update({ collection: 'pages', id, data: homeData });
  } else {
    console.log('[seed]   creating');
    await payload.create({ collection: 'pages', data: homeData });
  }

  console.log('[seed] done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
