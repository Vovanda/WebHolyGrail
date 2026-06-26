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
  logo: { filename: 'whg-logo.svg', alt: 'Web Holy Grail — logo placeholder' },
  hero: { filename: 'whg-hero.svg', alt: 'Web Holy Grail — hero placeholder' },
  ogImage: { filename: 'og-placeholder.svg', alt: 'Web Holy Grail — social share image' },
  stack: { filename: 'feature-stack.svg', alt: 'Opinionated stack icon' },
  growth: { filename: 'feature-growth.svg', alt: 'Side-scaling growth icon' },
  contracts: { filename: 'feature-contracts.svg', alt: 'Contracts seam icon' },
} as const;

type MediaIds = Record<keyof typeof ASSETS, number>;

export async function createHomePage(payload: Payload): Promise<{ created: boolean; id: string }> {
  // 1. Media uploads (idempotent: проверяем по filename перед create).
  const mediaIds: MediaIds = {} as never;
  for (const [key, asset] of Object.entries(ASSETS) as [
    keyof typeof ASSETS,
    (typeof ASSETS)[keyof typeof ASSETS],
  ][]) {
    mediaIds[key] = await ensureMedia(payload, asset.filename, asset.alt);
  }

  // 2. SiteSettings: только если siteName дефолтный (не перезаписываем downstream).
  const existingSettings = await payload.findGlobal({ slug: 'site-settings' });
  if (!existingSettings.siteName || existingSettings.siteName === 'Web Holy Grail') {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        siteName: 'Web Holy Grail',
        logo: mediaIds.logo,
        contacts: {
          email: 'contact@webholygrail.dev',
        },
        mainNav: [
          { href: '/', label: 'Главная' },
          { href: '/docs', label: 'Документация' },
          { href: 'https://github.com/Vovanda/WebHolyGrail', label: 'GitHub', external: true },
          {
            href: 'https://github.com/Vovanda/WebHolyGrail/issues',
            label: 'Issues',
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
    if (hasContent) {
      return { created: false, id: String(existingPage.id) };
    }
    const updated = await payload.update({
      collection: 'pages',
      id: existingPage.id,
      data: buildHomePageData(mediaIds),
    });
    return { created: true, id: String(updated.id) };
  }

  const page = await payload.create({
    collection: 'pages',
    data: buildHomePageData(mediaIds),
  });

  return { created: true, id: String(page.id) };
}

/**
 * Полный content draft главной страницы WHG-визитки.
 *
 * @remarks
 * Композиция через готовые блоки (R9 — никаких новых компонентов под лендинг):
 *  - Hero — большой заголовок + tagline
 *  - Prose (editorial-with-dropcap) — манифест 3 абзаца
 *  - WaveDivider — переход
 *  - AchievementBanner amber — «Между статичкой и plugin-CMS» с тезисами
 *  - CertifiedNotice — «Что вшито в коробке» как стек-список
 *  - WaveDivider flipped — переход
 *  - Quote minimal-modern — principle manifest
 *  - Timeline editorial-dots — 4 этапа роста сайта
 */
function buildHomePageData(mediaIds: MediaIds) {
  return {
    title: 'Главная',
    slug: 'home',
    _status: 'published' as const,
    seo: {
      title: 'Web Holy Grail — opinionated template для production small-business сайтов',
      description:
        'Один сайт, который растёт вместе с бизнесом. Next.js 15 + Payload 3 + Docker + Infisical из коробки. Между статичкой и plugin-CMS.',
      ogImage: mediaIds.ogImage,
    },
    blocks: [
      {
        blockType: 'hero' as const,
        title: 'Opinionated {accent} для производственных сайтов',
        titleAccent: 'template',
        subtitle:
          'Один сайт, который растёт вместе с бизнесом. Next.js 15 + Payload 3 + Docker — без сборки конструктора с нуля каждый раз.',
        subtitleShort: 'Сайт, который растёт вместе с бизнесом.',
      },
      {
        blockType: 'prose' as const,
        variant: 'editorial-with-dropcap' as const,
        body:
          "Web Holy Grail — это не фреймворк и не библиотека. Это рабочий каркас сайта малого бизнеса, в котором архитектура задана с первого commit'а. Tilda не масштабируется, WordPress превращает контент в плагин-хаос. Между ними — пустота, и WHG занимает её.\n\n" +
          'Здесь один стек, одно правило для границ между фронтом, контентом и бэком, один deploy-сценарий. Можно начать с визитки и через год дорасти до каталога с личным кабинетом — внутри того же репо, без миграции на «настоящий бэк».\n\n' +
          'Если ты разработчик с одним заказчиком и нужен честный production-каркас за вечер, а не неделю на «выбрать стек» — этот template для тебя.',
      },
      {
        blockType: 'wave-divider' as const,
        flipped: false,
      },
      {
        blockType: 'achievement-banner' as const,
        icon: '🎯',
        title: 'Между статичкой и plugin-CMS',
        titleSuffix: '· уникальная ниша',
        accent: 'amber' as const,
        items: [
          { text: 'Свой рендер, своя БД, своя админка — без vendor lock-in' },
          { text: 'Контент редактируется через UI Payload, не правкой кода' },
          { text: 'Sync с upstream шаблоном — обновления приходят сами' },
          { text: 'SSR-default, без сюрпризов с гидрацией' },
        ],
      },
      {
        blockType: 'certified-notice' as const,
        kicker: 'ВЫ ПОЛУЧАЕТЕ В КОРОБКЕ',
        title: 'Стек, который не нужно собирать',
        body: 'Шесть компонентов уже соединены контрактами и Dockerfile. Точечно меняется любой слой — соседи не ломаются.',
        criteriaTitle: 'Что вшито',
        criteria: [
          { text: 'Next.js 15 App Router (SSR + RSC, file-based routing)' },
          { text: 'Payload 3.x — schema-first CMS на TypeScript' },
          { text: 'shadcn/ui + Tailwind + CSS-токены (R2-only colors)' },
          { text: 'SQLite по умолчанию, Postgres когда дорастёшь' },
          { text: 'Docker compose blue-green deploy + nginx + certbot' },
          { text: 'Infisical для секретов — без .env на проде' },
        ],
      },
      {
        blockType: 'wave-divider' as const,
        flipped: true,
      },
      {
        blockType: 'quote' as const,
        heading: 'Принцип',
        body: 'Скучный предсказуемый каркас сейчас — безграничное расширение потом. Side-scaling: новая фича не переписывает существующее, она добавляется сбоку.',
        author: 'Web Holy Grail',
        role: 'Architectural manifesto · R4',
        variant: 'minimal-modern' as const,
      },
      {
        blockType: 'timeline' as const,
        heading: 'Путь сайта',
        visibleCount: 4,
        sort: 'manual' as const,
        variant: 'editorial-dots' as const,
        entries: [
          {
            year: 'День 1',
            icon: '🌱',
            body: 'gh repo create --template Vovanda/WebHolyGrail → pnpm install → pnpm setup-infisical → pnpm dev. Сайт-визитка с этой же страницей под крышей твоего домена.',
          },
          {
            year: 'Месяц 1-3',
            icon: '🏗️',
            body: 'Добавляешь blocks/domain/<niche>/ под свой бизнес — карточки услуг, форма обратной связи, портфолио. Контракты типизируют семантику данных. Ядро шаблона не трогается.',
          },
          {
            year: 'Год 1',
            icon: '🚀',
            body: 'Появляется каталог, блог, личный кабинет — каждое как новое поддерево внутри того же репо. Sync с upstream подтягивает свежие primitives без боли.',
          },
          {
            year: 'Год 2+',
            icon: '⚙️',
            body: 'Когда нужен реальный бэк — рождается src/api/ рядом с cms/. Repositories поверх той же БД, без переписывания фронта. SQLite → Postgres одной строкой адаптера.',
          },
        ],
      },
    ],
  };
}

/**
 * Ищет Media по filename (idempotent). Если нет — создаёт через `filePath`,
 * Payload автоматически прогоняет sharp + storage-s3 plugin → файл попадает
 * в S3 bucket (или MinIO в dev), URL вычисляется через bucketname/endpoint.
 */
async function ensureMedia(payload: Payload, filename: string, alt: string): Promise<number> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (existing.docs.length > 0) {
    return Number(existing.docs[0]!.id);
  }
  const filePath = resolve(ASSETS_DIR, filename);
  const doc = await payload.create({
    collection: 'media',
    data: { alt, prefix: 'placeholder' },
    filePath,
  });
  return Number(doc.id);
}
