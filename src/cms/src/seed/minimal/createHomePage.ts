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
        ctaSecondary: { label: 'Смотреть демо', href: '#built' },
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
        command: 'gh repo create my-site --template Vovanda/WebHolyGrail',
        caption: 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
      },

      // 3. Stack transparency — ряд иконок технологий.
      {
        blockType: 'stack-transparency' as const,
        heading: 'Что под капотом',
        subtitle: 'Решения зафиксированы — фокусируйтесь на продукте.',
        items: [
          { icon: '⚡', label: 'Next.js 15' },
          { icon: '📝', label: 'Payload 3' },
          { icon: '⚛️', label: 'React 19' },
          { icon: '🐳', label: 'Docker' },
          { icon: '📘', label: 'TypeScript' },
          { icon: '🎨', label: 'Tailwind 4' },
          { icon: '🔐', label: 'Infisical' },
        ],
      },

      // 4. Comparison — red ✗ vs green ✓.
      {
        blockType: 'comparison-table' as const,
        heading: 'Большинство сайтов заканчиваются тупиком',
        leftLabel: 'Обычный путь',
        rightLabel: 'С Web Holy Grail',
        leftItems: [
          { text: 'Сайт на конструкторе — нужен блог → переезд на CMS' },
          { text: 'Заказали кабинет — переписали с нуля' },
          { text: 'Через год снова конструктор лучше подходит' },
        ],
        rightItems: [
          { text: 'Начали с визитки на своём сервере' },
          { text: 'Добавили блог — без переезда' },
          { text: 'Растёт в портал и продукт — тот же фундамент' },
        ],
      },

      // 5. Feature grid — что уже решено.
      {
        blockType: 'feature-grid' as const,
        heading: 'Что уже решено за вас',
        items: [
          {
            icon: '🌐',
            title: 'Frontend',
            subtitle: 'Next.js 15 + React 19',
            description: 'SSR по умолчанию',
          },
          {
            icon: '📝',
            title: 'CMS',
            subtitle: 'Payload 3',
            description: 'Админка на русском',
          },
          {
            icon: '🐳',
            title: 'Deploy',
            subtitle: 'Docker + blue-green',
            description: 'Zero-downtime',
          },
          {
            icon: '🗄️',
            title: 'Storage',
            subtitle: 'S3-совместимое',
            description: 'MinIO в dev',
          },
          {
            icon: '🔐',
            title: 'Secrets',
            subtitle: 'Infisical',
            description: 'Никаких .env на проде',
          },
          {
            icon: '💾',
            title: 'Data',
            subtitle: 'SQLite по умолчанию',
            description: 'Postgres одной строкой',
          },
          {
            icon: '🧩',
            title: 'Architecture',
            subtitle: 'Contracts boundary',
            description: 'Изоляция фронта и бэка',
          },
        ],
      },

      // 6. Built with — реальные production-сайты на стеке.
      {
        blockType: 'built-with' as const,
        heading: 'Сайты, которые уже работают',
        subtitle: 'Реальные production-инстансы на этом стеке.',
        items: [
          { siteName: 'veo55.ru', url: 'https://veo55.ru', niche: 'Питомник немецких овчарок' },
          { siteName: 'sawking.tech', url: 'https://sawking.tech', niche: 'Личный сайт + блог' },
          { siteName: 'sng74.ru', url: 'https://sng74.ru', niche: 'Сервис в Челябинске' },
          {
            siteName: 'fitness-mafia.ru',
            url: 'https://fitness-mafia.ru',
            niche: 'Фитнес-клуб',
          },
        ],
      },

      // 7. Project types — WHG-specific 2×2 grid.
      {
        blockType: 'project-types-grid' as const,
        heading: 'Одна архитектура. Несколько сценариев роста.',
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

      // 8. Quote — full-width-dark manifesto.
      {
        blockType: 'quote' as const,
        variant: 'full-width-dark' as const,
        body: 'Технологии уже позволяют дать малому бизнесу нормальный сайт с честной архитектурой — почти даром.',
        author: 'Владимир Савкин',
        role: 'архитектор Web Holy Grail',
        authorHref: 'https://github.com/Vovanda',
      },

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
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    const doc = existing.docs[0]!;
    return { id: Number(doc.id), url: String(doc.url ?? '') };
  }
  const filePath = resolve(ASSETS_DIR, filename);
  const doc = await payload.create({
    collection: 'media',
    data: { alt, prefix: 'placeholder' },
    filePath,
  });
  return { id: Number(doc.id), url: String(doc.url ?? '') };
}
