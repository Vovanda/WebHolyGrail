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
const FORCE = process.env.SEED_FORCE === '1' || process.argv.includes('--force');

async function main() {
  console.log(
    `[seed] starting… ${FORCE ? '(FORCE mode — затрёт правки)' : '(idempotent — пропустит существующие)'}`,
  );
  const payload = await getPayload({ config });

  // ── Admin user (bootstrap) ──────────────────────────────────────
  // Идемпотентно: создаём только если коллекция users пуста. Креды берутся
  // ТОЛЬКО из env (`.env.local`, gitignored) — никогда не хардкодим пароль в коде.
  const userCount = await payload.count({ collection: 'users' });
  if (userCount.totalDocs === 0) {
    const email = process.env.ADMIN_INITIAL_EMAIL;
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!email || !password) {
      console.warn(
        '[seed] users пуста, но ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD не заданы в .env.local — admin не создан. Создай через /admin/create-first-user либо задай env и перезапусти.',
      );
    } else {
      console.log(`[seed] users пуста — создаю admin (${email})`);
      await payload.create({
        collection: 'users',
        data: {
          email,
          password,
          name: 'Admin',
          role: 'admin',
        },
      });
    }
  } else {
    console.log(`[seed] users: ${userCount.totalDocs} — admin уже есть, пропускаю`);
  }

  // ── SiteSettings ────────────────────────────────────────────────
  // Global: проверяем не настроен ли уже (siteName выставлен ≠ дефолт).
  const existingSettings = await payload.findGlobal({ slug: 'site-settings' }).catch(() => null);
  const settingsAlreadyConfigured =
    (existingSettings?.siteName && existingSettings.siteName !== 'Питомник «Омская Дружина»') ||
    (existingSettings?.mainNav?.length ?? 0) > 0;
  if (settingsAlreadyConfigured && !FORCE) {
    console.log('[seed] SiteSettings уже заполнен — пропускаю (SEED_FORCE=1 чтобы перезаписать)');
  } else {
    console.log('[seed] SiteSettings…');
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        siteName: 'Питомник «Омская Дружина»',
        contacts: {
          phone: '+7 (908) 313 25 49',
          email: 'mail@veo55.ru',
          address: 'г. Омск',
          hours: 'ПН–ВС 11:00–22:00',
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
  }

  // ── Главная страница ───────────────────────────────────────────
  console.log('[seed] Pages: главная (slug="home")');
  const existingHome = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  const homeBlocks = [
    {
      blockType: 'banner-slider' as const,
      banners: [
        {
          imageUrl: 'https://cdn.veo55.ru/headers/banner1%20.png',
          alt: 'Питомник ВЕО «Омская Дружина»',
        },
        {
          imageUrl: 'https://cdn.veo55.ru/headers/banner2.png',
          alt: 'Восточноевропейская овчарка питомника «Омская Дружина»',
        },
      ],
    },
    {
      blockType: 'hero' as const,
      // 1:1 из оригинала main.html L282: <b>Щенки ВЕО</b> с документами РКФ
      title: '{accent} с документами РКФ',
      titleAccent: 'Щенки ВЕО',
      subtitle: 'Питомник восточноевропейской овчарки «Омская Дружина» · г. Омск',
      subtitleShort: 'Питомник ВЕО «Омская Дружина» · г. Омск',
    },
    {
      blockType: 'wave-divider' as const,
    },
    {
      blockType: 'quote' as const,
      heading: 'О нас',
      // 1:1 из main.html L713
      body: 'Я являюсь заводчиком восточноевропейских овчарок и основателем питомника ВЕО «Омская Дружина». Моя история с этой породой началась более 30 лет назад, когда в нашей семье появилась первая собака. С тех пор я не перестаю восхищаться её преданностью, умом и силой духа — и с огромной любовью занимаюсь разведением ВЕО.',
      author: 'Савкина Ольга Владимировна',
      role: 'Основатель питомника',
      photoUrls: [
        { url: 'https://cdn.veo55.ru/images/about/olga-1.jpg' },
        { url: 'https://cdn.veo55.ru/images/about/olga-2.jpg' },
        { url: 'https://cdn.veo55.ru/images/about/olga-3.jpg' },
        { url: 'https://cdn.veo55.ru/images/about/olga-4.jpg' },
        { url: 'https://cdn.veo55.ru/images/about/olga-5.jpg' },
        { url: 'https://cdn.veo55.ru/images/about/olga-6.jpg' },
      ],
      variant: 'card-accent-left',
    },
    {
      blockType: 'prose' as const,
      // 1:1 из main.html L726-728
      body: [
        'В нашем питомнике мы тщательно отбираем производителей: они участвуют в выставках и получают отличные оценки, проходят курсы дрессировки, тесты и ежегодную диспансеризацию.',
        'Все собаки привиты, обработаны от паразитов и проходят регулярные медицинские проверки; производители проверяются на дисплазию суставов и сдают генетические тесты на ДМ. Питание — мясо, рыба, костное или сухие корма супер-премиум класса.',
        'Щенки чёрного, зонарного и чепрачного окраса растут в самых лучших условиях. Все щенки имеют документы РКФ-FCI.',
      ].join('\n\n'),
      variant: 'editorial-with-dropcap',
    },
    {
      blockType: 'wave-divider' as const,
    },
    {
      blockType: 'timeline' as const,
      heading: 'Наш путь',
      // 1:1 из main.html L737-742. Первые 3 видны, остальные раскрываются кнопкой.
      entries: [
        {
          year: '2026',
          icon: '🏆',
          body: 'Помёт литера «Н» получил отметку РКФ «Отборное разведение / Selected Breeding» — высший статус, доступный единицам помётов ВЕО в России.',
        },
        {
          year: '2024',
          icon: '😁',
          body: 'Участвуем в развитии породы за пределами России: «Омская Дружина Империал» восстанавливает популяцию ВЕО в Великобритании.',
        },
        {
          year: '2022',
          icon: '🏆',
          body: 'Наши собаки вышли в рабочий класс.',
        },
        {
          year: '2019',
          body: 'Родилось четвёртое поколение собак нашего разведения.',
        },
        {
          year: '2012',
          icon: '📜',
          body: 'Присвоена приставка «Омская Дружина».',
        },
        {
          year: '2008',
          body: 'Получены первые щенки восточноевропейской овчарки.',
        },
      ],
      visibleCount: 3,
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

  // Payload generated types для blocks-union строже чем наш runtime-shape; runtime
  // Payload валидирует сам, так что type-cast тут безопасный.
  if (existingHome.docs.length > 0) {
    if (!FORCE) {
      console.log(
        `[seed]   exists (id=${existingHome.docs[0]!.id}) — пропускаю (idempotent). SEED_FORCE=1 чтобы перезаписать`,
      );
    } else {
      const id = existingHome.docs[0]!.id;
      console.log(`[seed]   exists (id=${id}) — FORCE updating (затирает правки)`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.update({ collection: 'pages', id, data: homeData as any });
    }
  } else {
    console.log('[seed]   creating');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'pages', data: homeData as any });
  }

  console.log('[seed] done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
