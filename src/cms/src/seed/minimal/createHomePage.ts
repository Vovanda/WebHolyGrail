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
 * Default home page — короткий лендинг через готовые блоки.
 * Hero + Carousel screenshots + Quick start + Что внутри + Layout note.
 * Полное описание продукта — `docs/whg/00-overview.md` (single source of truth).
 */
function buildHomePageData(media: MediaMap) {
  return {
    title: 'Главная',
    slug: 'home',
    _status: 'published' as const,
    seo: {
      title: 'Web Holy Grail',
      description: 'Готовый self-hosted сайт с CMS-админкой. Next.js 15 + Payload 3 + Docker. MIT.',
      ogImage: media.ogImage.id,
    },
    blocks: [
      {
        blockType: 'hero' as const,
        title: 'Сайт с {accent} на собственном домене',
        titleAccent: 'админкой',
        subtitle:
          'Клонируете, деплоите — и сразу создаёте страницы через визуальную админку. Next.js 15 + Payload 3 + Docker.',
        subtitleShort: 'Сайт с админкой на собственном домене.',
      },
      {
        blockType: 'banner-slider' as const,
        banners: [
          { imageUrl: media.screenshotLanding.url, alt: 'Главная страница сайта' },
          { imageUrl: media.screenshotAdmin.url, alt: 'Админка Payload: список страниц' },
          {
            imageUrl: media.screenshotBlockEditor.url,
            alt: 'Редактор блока с превью в реальном времени',
          },
          { imageUrl: media.screenshotMedia.url, alt: 'Галерея медиа в S3' },
        ],
      },
      {
        blockType: 'prose' as const,
        variant: 'modern-sans' as const,
        body:
          'Запустить за 5 минут:\n\n' +
          '```\n' +
          'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone\n' +
          'cd my-site && corepack enable && pnpm install\n' +
          'pnpm setup-infisical -- --site my-site\n' +
          './dev-setup.sh && ./dev.sh\n' +
          '```\n\n' +
          'localhost:3000 — сайт. localhost:3001/admin — админка.',
      },
      {
        blockType: 'certified-notice' as const,
        title: 'Что внутри',
        body: '',
        criteriaTitle: '',
        criteria: [
          { text: 'UI: shadcn/ui + Tailwind + дизайн-токены под бренд через переменные.' },
          {
            text: 'CMS с админкой на русском: Payload 3, drag-and-drop блоков, типизированные поля.',
          },
          { text: 'БД за слоем доступа: SQLite на старте, Postgres одной строкой адаптера.' },
          { text: 'Секреты в Infisical (self-host или cloud), `.env` не нужен.' },
          { text: 'Медиа в S3: MinIO в dev, любой S3-совместимый провайдер в prod.' },
          { text: 'Модульная архитектура: фронт / CMS / контракты — отдельные workspace.' },
          { text: 'Blue-green deploy: Docker compose + nginx + Let’s Encrypt, zero-downtime.' },
          { text: 'sync-template.sh подтягивает улучшения upstream, не трогая ваш доменный код.' },
        ],
      },
      {
        blockType: 'prose' as const,
        variant: 'modern-sans' as const,
        body:
          'Композиция страницы хранится в CMS как JSON. Где Header, Sidebar, Footer — конфиг в админке, не JSX. Шесть слотов (top / bottom / left / right / center / overlay), видимость блоков по брейкпоинтам — чекбокс в админке. Из коробки один пресет `classic-site`, новые добавляются по мере потребности.\n\n' +
          'Документация и исходники — в GitHub-репозитории (ссылка в навигации).',
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
