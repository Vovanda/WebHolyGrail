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
          icon: '🐾',
          body: 'Родилось четвёртое поколение собак нашего разведения.',
        },
        {
          year: '2012',
          icon: '📜',
          body: 'Присвоена приставка «Омская Дружина».',
        },
        {
          year: '2008',
          icon: '🐾',
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

  // ── Помёт «Литера Н, 2026» (Чипса) ─────────────────────────────
  // Первый живой помёт для проверки end-to-end:
  //   Dogs (Chipsa, Bars) → Litter с nested puppies (3 шт.: avail, reserved, sold)
  //                       → Page /litera-n-2026 с LitterCard + Prose «отборное поведение»
  await seedChipsaLitter(payload);

  console.log('[seed] done.');
  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedChipsaLitter(payload: any) {
  console.log('[seed] Помёт Чипсы (литера Н, 2026)');

  // 1. Родители — Dogs
  const motherSlug = 'chipsa';
  const fatherSlug = 'bars';

  const existingMother = await payload.find({
    collection: 'dogs',
    where: { slug: { equals: motherSlug } },
    limit: 1,
  });
  let motherId = existingMother.docs[0]?.id;
  if (!motherId) {
    console.log(`[seed]   creating dog "${motherSlug}"`);
    const created = await payload.create({
      collection: 'dogs',
      data: {
        name: 'Чипса',
        slug: motherSlug,
        sex: 'female',
        color: 'cheprachny',
        titles: [
          { text: 'Чемпион РКФ' },
          { text: 'Юный чемпион России' },
          { text: 'Победитель ВЕО-монопородной выставки' },
        ],
        _status: 'published',
      },
    });
    motherId = created.id;
  } else {
    console.log(`[seed]   dog "${motherSlug}" exists (id=${motherId})`);
  }

  const existingFather = await payload.find({
    collection: 'dogs',
    where: { slug: { equals: fatherSlug } },
    limit: 1,
  });
  let fatherId = existingFather.docs[0]?.id;
  if (!fatherId) {
    console.log(`[seed]   creating dog "${fatherSlug}"`);
    const created = await payload.create({
      collection: 'dogs',
      data: {
        name: 'Барс',
        slug: fatherSlug,
        sex: 'male',
        color: 'cherny',
        titles: [{ text: 'Чемпион России' }, { text: 'Рабочий класс' }],
        _status: 'published',
      },
    });
    fatherId = created.id;
  } else {
    console.log(`[seed]   dog "${fatherSlug}" exists (id=${fatherId})`);
  }

  // 2. Помёт
  const litterSlug = 'litera-n-2026';
  const existingLitter = await payload.find({
    collection: 'litters',
    where: { slug: { equals: litterSlug } },
    limit: 1,
  });

  const litterData = {
    title: 'Помёт литера Н, 2026',
    slug: litterSlug,
    dob: '2026-03-15T00:00:00.000Z',
    status: 'active' as const,
    mother: motherId,
    father: fatherId,
    showMotherTitles: true,
    showMotherDescription: false,
    showFatherTitles: true,
    showFatherDescription: false,
    puppies: [
      {
        name: 'Найра',
        sex: 'female' as const,
        color: 'cheprachny' as const,
        state: 'available' as const,
        notes: 'Спокойная, контактная, лидер на прогулке',
      },
      {
        name: 'Норд',
        sex: 'male' as const,
        color: 'cherny' as const,
        state: 'reserved' as const,
        notes: 'Крупный, активный',
      },
      {
        name: 'Найт',
        sex: 'male' as const,
        color: 'zonarny' as const,
        state: 'sold' as const,
        notes: 'Уехал в Калининград',
      },
    ],
    _status: 'published' as const,
  };

  let litterId: string;
  if (existingLitter.docs.length > 0) {
    litterId = existingLitter.docs[0].id;
    if (FORCE) {
      console.log(`[seed]   litter exists (id=${litterId}) — FORCE updating`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.update({ collection: 'litters', id: litterId, data: litterData as any });
    } else {
      console.log(
        `[seed]   litter exists (id=${litterId}) — skip (SEED_FORCE=1 чтобы перезаписать)`,
      );
    }
  } else {
    console.log('[seed]   creating litter');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await payload.create({ collection: 'litters', data: litterData as any });
    litterId = created.id;
  }

  // 3. Страница помёта
  const pageSlug = litterSlug;
  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: pageSlug } },
    limit: 1,
  });

  const pageData = {
    title: 'Помёт литера Н, 2026 (Чипса)',
    slug: pageSlug,
    blocks: [
      {
        blockType: 'litter-card' as const,
        litter: litterId,
        showSold: false,
      },
      // «Произвольная вставка» (R: «секция для произвольного блока в рамке»):
      // делается соседним Prose-блоком, не полем внутри LitterCard.
      {
        blockType: 'prose' as const,
        body: 'Помёт «Чипса» — особенный: РКФ присвоила ему статус «Отборное разведение / Selected Breeding», что доступно единицам помётов ВЕО в России. Это значит, что родители прошли максимально жёсткие проверки здоровья, рабочих качеств и характера, а сами щенки растут под контролем эксперта-кинолога с первого дня жизни.',
        variant: 'editorial-with-dropcap',
      },
    ],
    seo: {
      title: 'Помёт литера Н 2026 (Чипса × Барс) · Питомник «Омская Дружина»',
      description:
        'Щенки восточноевропейской овчарки от пары Чипса × Барс, помёт литера Н 2026. Отборное разведение РКФ. Питомник «Омская Дружина», Омск.',
    },
    _status: 'published' as const,
  };

  if (existingPage.docs.length > 0) {
    const id = existingPage.docs[0].id;
    if (FORCE) {
      console.log(`[seed]   page exists (id=${id}) — FORCE updating`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.update({ collection: 'pages', id, data: pageData as any });
    } else {
      console.log(`[seed]   page exists (id=${id}) — skip`);
    }
  } else {
    console.log('[seed]   creating page');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'pages', data: pageData as any });
  }
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
