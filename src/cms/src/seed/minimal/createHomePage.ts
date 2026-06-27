import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Payload } from 'payload';

/**
 * createHomePage — собирает «визитку» template'а как Payload Page.
 *
 * @remarks
 * Идеология: эта стартовая страница — не статика в JSX, а **обычный Payload
 * документ**. Контент-менеджер заменяет тексты / картинки / порядок блоков
 * через /admin без правки кода (R0 «контент в БД, не код» в действии).
 *
 * Что seed-скрипт делает:
 *  1. Загружает SVG-placeholder'ы в Media collection через Local API +
 *     `filePath`. Payload + `@payloadcms/storage-s3` плагин автоматически
 *     сольёт файлы в S3 (MinIO в dev, реальный bucket в prod).
 *  2. Обновляет SiteSettings global (siteName + logo + mainNav) при первом seed.
 *  3. Создаёт Page `slug=home` с layout из готовых блоков
 *     (Hero + Prose + AchievementBanner + CertifiedNotice + Quote + Timeline + WaveDivider).
 *
 * Идемпотентно:
 *  - Media: по filename — реюз существующих.
 *  - SiteSettings: обновляем только если siteName дефолтный (downstream-кастомизация
 *    не затирается).
 *  - Page: если уже есть с непустыми blocks → не трогаем; если blocks пустые
 *    (от baseline-seed без визитки) → перезаписываем.
 */

const ASSETS_DIR = resolve(fileURLToPath(import.meta.url), '../assets');

const ASSETS = {
  logo: { filename: 'whg-logo.svg', alt: 'Web Holy Grail logo' },
  hero: { filename: 'whg-hero.svg', alt: 'Hero background' },
  ogImage: { filename: 'og-placeholder.svg', alt: 'Web Holy Grail — social share image' },
  screenshotLanding: {
    filename: 'screenshot-landing.svg',
    alt: 'Screenshot: landing page',
  },
  screenshotAdmin: { filename: 'screenshot-admin.svg', alt: 'Screenshot: Payload admin' },
  screenshotBlockEditor: {
    filename: 'screenshot-block-editor.svg',
    alt: 'Screenshot: block editor with live preview',
  },
  screenshotMedia: { filename: 'screenshot-media.svg', alt: 'Screenshot: media gallery' },
  // BuiltWith preview screenshots — реальные production-сайты на стеке.
  siteVeo55: {
    filename: 'sites/veo55-screenshot.jpeg',
    alt: 'veo55.ru — главная страница',
  },
  siteSawkingTech: {
    filename: 'sites/sawking-tech-screenshot.jpeg',
    alt: 'sawking.tech — главная страница',
  },
  siteSng74: {
    filename: 'sites/sng74-screenshot.jpeg',
    alt: 'sng74.ru — главная страница',
  },
  siteFitnessMafia: {
    filename: 'sites/fitness-mafia-screenshot.jpeg',
    alt: 'fitness-mafia.ru — главная страница',
  },
} as const;

type MediaInfo = { id: number; url: string };
type MediaMap = Record<keyof typeof ASSETS, MediaInfo>;

export async function createHomePage(payload: Payload): Promise<{ created: boolean; id: string }> {
  // 1. Media uploads (idempotent: проверяем по filename перед create).
  const media: MediaMap = {} as never;
  for (const [key, asset] of Object.entries(ASSETS) as [
    keyof typeof ASSETS,
    (typeof ASSETS)[keyof typeof ASSETS],
  ][]) {
    media[key] = await ensureMedia(payload, asset.filename, asset.alt);
  }

  // 2. SiteSettings: только если siteName дефолтный (не перезаписываем downstream).
  const existingSettings = await payload.findGlobal({ slug: 'site-settings' });
  if (!existingSettings.siteName || existingSettings.siteName === 'Web Holy Grail') {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        siteName: 'Web Holy Grail',
        logo: media.logo.id,
        contacts: {
          email: 'contact@webholygrail.dev',
        },
        mainNav: [
          { href: '#features', label: 'Возможности' },
          { href: '#growth', label: 'Рост' },
          { href: '#stack', label: 'Стек' },
          {
            href: 'https://github.com/Vovanda/WebHolyGrail/blob/main/docs/whg/30-philosophy.md',
            label: 'Правила',
            external: true,
          },
          {
            href: 'https://github.com/Vovanda/WebHolyGrail/tree/main/docs',
            label: 'Документация',
            external: true,
          },
        ],
      },
    });
  }

  // 3. Home page — см. идемпотентность в JSDoc выше.
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const existingPage = existing.docs[0]!;
    const hasContent =
      Array.isArray(existingPage.blocks) && (existingPage.blocks as unknown[]).length > 0;
    // SEED_FORCE_HOME=1 — для итерации копирайта seed-default,
    // перезатирает home page даже если в ней уже есть блоки.
    const force = process.env['SEED_FORCE_HOME'] === '1';
    if (hasContent && !force) {
      return { created: false, id: String(existingPage.id) };
    }
    const updated = await payload.update({
      collection: 'pages',
      id: existingPage.id,
      data: buildHomePageData(media),
    });
    return { created: true, id: String(updated.id) };
  }

  const page = await payload.create({
    collection: 'pages',
    data: buildHomePageData(media),
  });

  return { created: true, id: String(page.id) };
}

/**
 * Default home page — marketing landing v2 (#35).
 * 10 секций: hero-split + install + stack + comparison + features + built-with +
 * project-types + quote (dark manifesto) + block-showcase + cta-banner.
 * Полное описание продукта — `docs/whg/00-overview.md` (single source of truth).
 */
function buildHomePageData(media: MediaMap) {
  return {
    title: 'Главная',
    slug: 'home',
    _status: 'published' as const,
    seo: {
      title: 'Web Holy Grail',
      description:
        'Self-hosted сайт с CMS и архитектурой, которая не заставит вас начинать заново через год. Next.js 15 + Payload 3 + Docker. MIT.',
      ogImage: media.ogImage.id,
    },
    blocks: [
      // 1. Hero — двух-колоночный с GrowthPath card справа.
      {
        blockType: 'hero-split' as const,
        heading: 'Начните с сайта. Вырастите во что угодно.',
        subtitle:
          'Web Holy Grail — self-hosted сайт с CMS и архитектурой, которая не заставит вас начинать заново через год.',
        ctaPrimary: {
          label: 'Использовать шаблон',
          href: 'https://github.com/Vovanda/WebHolyGrail/generate',
        },
        ctaSecondary: {
          label: 'Документация',
          href: 'https://github.com/Vovanda/WebHolyGrail/tree/main/docs',
        },
        badges: [
          { label: 'Self-hosted' },
          { label: 'MIT License' },
          { label: 'Docker Ready' },
          { label: 'TypeScript First' },
        ],
        rightTitle: 'Один фундамент — разные сценарии',
        rightSteps: [
          { icon: '🪪', label: 'Визитка', sub: 'Начните с простого сайта' },
          { icon: '📝', label: 'Блог', sub: 'Добавьте контент и статьи' },
          { icon: '👥', label: 'Портал', sub: 'Личный кабинет и пользователи' },
          { icon: '🧩', label: 'Продукт', sub: 'Новые сервисы и интеграции' },
        ],
        rightCaption: 'Один фундамент. Без переписывания.',
      },

      // 2. Install snippet — one-liner с copy-кнопкой.
      {
        blockType: 'install-snippet' as const,
        command: 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
        caption:
          'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
      },

      // 3. Stack transparency — brand-logos через simple-icons CDN (brand-colors).
      {
        blockType: 'stack-transparency' as const,
        heading: 'Что под капотом',
        subtitle: 'Решения зафиксированы — фокусируйтесь на продукте.',
        items: [
          { icon: 'https://cdn.simpleicons.org/nextdotjs/000000', label: 'Next.js 15' },
          { icon: 'https://cdn.simpleicons.org/payloadcms/000000', label: 'Payload 3' },
          { icon: 'https://cdn.simpleicons.org/react/61DAFB', label: 'React 19' },
          { icon: 'https://cdn.simpleicons.org/docker/2496ED', label: 'Docker' },
          { icon: 'https://cdn.simpleicons.org/typescript/3178C6', label: 'TypeScript' },
          { icon: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', label: 'Tailwind 4' },
          // Infisical brand-mark — символ бесконечности (Володя: "у Infisical
          // значок бесконечности"). Unicode ∞ дешевле любого favicon-скачивания
          // и точно соответствует brand identity.
          { icon: '∞', label: 'Infisical' },
        ],
      },

      // Separator: gradient fade-out перед comparison.
      { blockType: 'wave-divider' as const, variant: 'gradient' as const },

      // 4. Comparison — cycle of pain (failure + повторная стоимость) vs WHG growth.
      {
        blockType: 'comparison-table' as const,
        heading: 'Большинство сайтов заканчиваются тупиком',
        leftLabel: 'Обычный путь — цикл боли',
        rightLabel: 'С Web Holy Grail',
        leftItems: [
          { text: 'Сайт-визитка на конструкторе' },
          { text: '↻ Нужен блог — платим за миграцию на CMS, теряем SEO' },
          { text: 'Заказали личный кабинет' },
          { text: '↻ Переписали с нуля — ещё 3 месяца и +N₽' },
          { text: 'Через год снова не то' },
          { text: '↻ Новый редизайн с нуля — третий раз' },
        ],
        rightItems: [
          { text: 'Начали с визитки на своём сервере' },
          { text: 'Добавили блог — без переезда' },
          { text: 'Личный кабинет — тот же фундамент' },
          { text: 'Через год — новые сервисы рядом, не вместо' },
        ],
      },

      // Separator: волна между Comparison и FeatureGrid.
      { blockType: 'wave-divider' as const, variant: 'wave' as const },

      // 5. Feature grid 2-3-2 шахматка — brand-logos где есть, generic
      //   emoji где simple-icons нет ниши (architecture).
      {
        blockType: 'feature-grid' as const,
        heading: 'Что уже решено за вас',
        items: [
          {
            icon: 'https://cdn.simpleicons.org/nextdotjs/000000',
            title: 'Frontend',
            subtitle: 'Next.js 15 + React 19',
            description: 'SSR по умолчанию',
            details:
              'App Router + React Server Components: страницы рендерятся на сервере, в браузер уходит готовый HTML — быстро на первом экране, хорошо для SEO.\n\nИнтерактивные островки помечаются «use client» — bundle минимальный. Универсальный SiteLayout с panel-композицией: header, footer, drawer, sidebar собираются из JSON, не из JSX.',
          },
          {
            icon: 'https://cdn.simpleicons.org/payloadcms/000000',
            title: 'CMS',
            subtitle: 'Payload 3',
            description: 'Админка на русском',
            details:
              'Block-editor с drag-and-drop, типизированные коллекции, role-based доступ, версионирование и черновики из коробки.\n\nLocal API напрямую из server-кода — не нужен REST для seed/cron/migrations. UI на русском с возможностью переключения языка.',
          },
          {
            icon: 'https://cdn.simpleicons.org/docker/2496ED',
            title: 'Deploy',
            subtitle: 'Docker + blue-green',
            description: 'Zero-downtime',
            details:
              'docker compose с двумя цветами (blue/green), nginx переключает upstream после healthcheck нового — zero-downtime деплой.\n\nМиграции применяются автоматически перед switch. Если новая версия упала — откат не нужен, старый цвет работает.',
          },
          {
            icon: '🗄️',
            title: 'Storage',
            subtitle: 'S3-совместимое',
            description: 'MinIO в dev',
            details:
              'Любой S3-совместимый провайдер: AWS S3, Cloudflare R2, Backblaze B2 или self-host MinIO. Один env-переменный набор переключает между ними.\n\nВ dev — MinIO в docker рядом, нулевая настройка. Без локального диска — медиа сразу там же где будет на проде.',
          },
          {
            // 🔒 (замочек) — Володя предложил для FeatureGrid "Secrets" (это
            // про роль = защита секретов). Stack Transparency для Infisical
            // как бренда — ∞ (их фирменный mark).
            icon: '🔒',
            title: 'Secrets',
            subtitle: 'Infisical',
            description: 'Никаких .env на проде',
            details:
              'Все секреты живут в Infisical (cloud или self-host). На VPS — только client-id + secret для machine identity, дальше всё через API.\n\nРотация без передеплоя, audit-trail, разные значения для dev/staging/prod без копирования файлов.',
          },
          {
            icon: 'https://cdn.simpleicons.org/sqlite/003B57',
            title: 'Data',
            subtitle: 'SQLite по умолчанию',
            description: 'Postgres одной строкой',
            details:
              'SQLite через libsql — нет внешней БД на старте, файл рядом с кодом. Подходит для визитки / блога / небольшого портала.\n\nPostgres — замена одной строкой в payload.config (через @payloadcms/db-postgres), миграции drizzle переносятся как есть.',
          },
          {
            icon: '🧩',
            title: 'Architecture',
            subtitle: 'Contracts boundary',
            description: 'Изоляция фронта и бэка',
            details:
              'Workspace contracts/ — единственная общая зависимость client и cms. Это TypeScript-интерфейсы блоков, страниц, SiteSettings.\n\nClient не знает про Payload (никаких прямых импортов из cms/), CMS не знает про React. Можно подменить любую сторону без переписки другой — frontend на Astro, CMS на Strapi.',
          },
        ],
      },

      // 6. Built with — реальные production-сайты на стеке.
      {
        blockType: 'built-with' as const,
        heading: 'Сайты, которые уже работают',
        subtitle: 'Реальные production-инстансы на этом стеке.',
        items: [
          {
            siteName: 'veo55.ru',
            url: 'https://veo55.ru',
            niche: 'Питомник восточно-европейских овчарок «Омская Дружина»',
            screenshot: media.siteVeo55.id,
          },
          {
            siteName: 'sawking.tech',
            url: 'https://sawking.tech',
            niche: 'Инженерия, архитектура, AI — личный блог',
            screenshot: media.siteSawkingTech.id,
          },
          {
            siteName: 'sng74.ru',
            url: 'https://sng74.ru',
            niche: 'Чистые помещения для фармы — B2B стройка',
            screenshot: media.siteSng74.id,
          },
          {
            siteName: 'fitness-mafia.ru',
            url: 'https://fitness-mafia.ru',
            niche: 'Персональные тренировки — личный бренд тренера',
            screenshot: media.siteFitnessMafia.id,
          },
        ],
      },

      // Separator: dots между BuiltWith и ProjectTypes.
      { blockType: 'wave-divider' as const, variant: 'dots' as const },

      // 7. Project types — WHG-specific 2×2 grid.
      // Heading на 2 строки с \n — последняя строка рендерится accent-цветом
      // (паттерн Supabase/Resend "Build in a weekend / Scale to millions").
      {
        blockType: 'project-types-grid' as const,
        heading: 'Одна архитектура.\nНесколько сценариев роста.',
        subtitle:
          'Выберите стартовую точку под ваш проект. Архитектура остаётся той же — меняется только стартовая конфигурация.',
        items: [
          {
            icon: '🟦',
            label: 'Minimal',
            description: 'Пустой сайт и базовые страницы',
            status: 'available' as const,
          },
          {
            icon: '🟩',
            label: 'Business Card',
            description: 'Услуги, контакты, формы, отзывы',
            status: 'roadmap' as const,
          },
          {
            icon: '🟨',
            label: 'Blog',
            description: 'Блог, категории, комментарии',
            status: 'roadmap' as const,
          },
          {
            icon: '🟪',
            label: 'Portal',
            description: 'Пользователи, кабинет, роли',
            status: 'roadmap' as const,
          },
        ],
        caption: 'Тип проекта — это старт, не ограничение. Добавляйте возможности по мере роста.',
      },

      // 8. Quote — editorial card-accent-left (привычный Володе вариант,
      // его дефолт для всех сайтов). После подключения QuoteCycle здесь
      // будет ротация: card-accent-left → full-width-dark → minimal-modern.
      // authorHref намеренно НЕ задан (Володя: "цитата без ссылки на мой
      // гитхаб в имени... а это поле вообще-то важное в контроле"). Поле
      // остаётся в Quote-блоке для других use-cases (testimonials с link
      // на site автора и т.д.).
      {
        blockType: 'quote' as const,
        heading: 'Философия проекта',
        variant: 'card-accent-left' as const,
        body: 'Технологии уже позволяют дать малому бизнесу нормальный сайт с честной архитектурой — почти даром.',
        author: 'Владимир Савкин',
        role: 'архитектор Web Holy Grail',
      },

      // Separator: line между Quote и BlockShowcase.
      { blockType: 'wave-divider' as const, variant: 'line' as const },

      // 9. Block showcase — карточки готовых блоков template'а.
      {
        blockType: 'block-showcase' as const,
        heading: 'Современный UI из коробки',
        subtitle: 'Готовые блоки на shadcn/ui + Tailwind + дизайн-токены.',
        items: [
          { label: 'Hero' },
          { label: 'Карусель' },
          { label: 'Цитата' },
          { label: 'Таймлайн' },
          { label: 'FAQ' },
          { label: 'Форма' },
        ],
      },

      // 10. CTA banner — финальный, blue solid.
      {
        blockType: 'cta-banner' as const,
        heading: 'Готовы начать?',
        subtitle:
          'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
        ctaPrimary: {
          label: 'Использовать шаблон на GitHub',
          href: 'https://github.com/Vovanda/WebHolyGrail/generate',
        },
        ctaSecondary: {
          label: 'Документация',
          href: 'https://github.com/Vovanda/WebHolyGrail/tree/main/docs',
        },
      },
    ],
  };
}

/**
 * Ищет Media по filename (idempotent). Если нет — создаёт через `filePath`,
 * Payload автоматически прогоняет sharp + storage-s3 plugin → файл попадает
 * в S3 bucket (или MinIO в dev), URL вычисляется через bucketname/endpoint.
 */
async function ensureMedia(payload: Payload, filename: string, alt: string): Promise<MediaInfo> {
  // Payload хранит filename как basename (без subdirs). filename в ASSETS может
  // содержать подкаталог (например 'sites/veo55-screenshot.jpeg') — для search
  // используем basename, для filePath — полный путь от ASSETS_DIR.
  const basename = filename.split('/').pop() ?? filename;
  const filePath = resolve(ASSETS_DIR, filename);

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: basename } },
    limit: 1,
  });

  // Если media уже есть И URL absolute — используем как есть.
  // Если URL relative (legacy seed без S3_PUBLIC_URL) — delete + create заново,
  // чтобы upload re-trigger'нул generateFileURL с актуальным env-state.
  // Page пересоздаётся в seed с force-flag → новый media-id подтянется.
  if (existing.docs.length > 0) {
    const doc = existing.docs[0]!;
    const currentUrl = String(doc.url ?? '');
    if (/^https?:\/\//i.test(currentUrl)) {
      return { id: Number(doc.id), url: currentUrl };
    }
    // Legacy URL — force-recreate.
    try {
      await payload.delete({ collection: 'media', id: doc.id });
    } catch {
      // если delete fails (например cascade FK) — fall through к update попытке
      const updated = await payload.update({
        collection: 'media',
        id: doc.id,
        data: { alt },
      });
      return { id: Number(updated.id), url: String(updated.url ?? '') };
    }
  }

  const doc = await payload.create({
    collection: 'media',
    data: { alt, prefix: 'placeholder' },
    filePath,
  });
  return { id: Number(doc.id), url: String(doc.url ?? '') };
}
