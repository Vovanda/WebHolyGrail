import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { ru } from '@payloadcms/translations/languages/ru';
import { en } from '@payloadcms/translations/languages/en';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { FormSubmissions } from './collections/FormSubmissions';
import { Dogs } from './collections/Dogs';
import { Litters } from './collections/Litters';
import { ReusableBlocks } from './collections/ReusableBlocks';
import { Posts } from './collections/Posts';
import { Comments } from './collections/Comments';
import { FaqGroups } from './collections/FaqGroups';
import { SiteSettings } from './globals/SiteSettings';
import { SyncVkPostsTask } from './jobs/sync-vk-posts.task';
import { FetchPedigreeTask } from './jobs/fetch-pedigree.task';
import { rkfEndpoints } from './endpoints/rkf';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Origin'ы для cors/csrf: CSV из env (`PAYLOAD_ALLOWED_ORIGINS`) + дефолтный
 * локальный + предзаданные demo-tunnel origin'ы. Дедуп по строке.
 */
function parseOrigins(csv: string | undefined, fallback: string): string[] {
  const fromEnv = (csv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    fallback,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'https://veo.sawking.tech',
  ];
  return Array.from(new Set([...defaults, ...fromEnv]));
}

/**
 * Payload config for veo55 site.
 *
 * - Admin UI на русском (fallback ru, en подключён для удобства).
 * - SQLite-адаптер: визитке хватает (memo `HolyGrail/70`).
 * - Lexical-editor — современный rich-text, заменил Slate в Payload 3.
 * - sharp — обработка картинок при загрузке Media.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Питомник veo55',
    },
    // Для custom React-компонентов в админке (UI-поля, beforeFields и т.п.):
    // payload генерирует importMap. baseDir = src/, дальше пути в полях вида
    // `/admin/components/<File>#default` ресолвятся в client-bundle.
    importMap: {
      baseDir: dirname,
    },
  },
  collections: [
    Users,
    Media,
    Pages,
    FormSubmissions,
    Dogs,
    Litters,
    ReusableBlocks,
    Posts,
    Comments,
    FaqGroups,
  ],
  globals: [SiteSettings],
  endpoints: [
    // Кастомные endpoints — `GET /api/rkf/dog?id=N` и `/api/rkf/search?q=X`.
    // См. `endpoints/rkf.ts`. Используется client `/catalog` для рендера
    // карточки/поиска собак с РКФ-каталога.
    ...rkfEndpoints,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI ?? 'file:./data/veo55.db',
    },
    // Отключаем drizzle push: схема меняется только через явные миграции.
    // Workflow — `.claude/skills/payload-migration/SKILL.md`:
    //   pnpm migrate:create <name> → правка SQL при необходимости → pnpm migrate.
    push: false,
    migrationDir: path.resolve(dirname, '../migrations'),
  }),
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'ru',
  },
  sharp,
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3001',
  // CORS / CSRF — список origin'ов, с которых разрешены не-GET запросы (publish,
  // update, delete, login). При работе через demo-tunnel домен внешний, поэтому
  // список расширен env-переменной `PAYLOAD_ALLOWED_ORIGINS` (CSV).
  // Дефолт включает локалку (3000 site, 3001 admin), 8080 (local nginx demo) и
  // публичный demo-домен veo.sawking.tech.
  cors: parseOrigins(
    process.env.PAYLOAD_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  csrf: parseOrigins(
    process.env.PAYLOAD_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  /**
   * Jobs Queue — Payload-native «облегчённый hangfire»: коллекция
   * `payload-jobs` в админке (status / retries / output / error) + ручной
   * запуск, scheduling из `task.schedule[]`, выполнение через `autoRun`.
   *
   * Активные tasks:
   *  - `sync-vk-posts` — каждые 15 мин (queue `social-sync`)
   *  - `fetch-pedigree` — раз в неделю (queue `pedigree`)
   *
   * Runner (`autoRun`) — каждую минуту проверяет all queues и забирает
   * следующий ready job. Не использовать одновременно с `pnpm payload
   * jobs:handle-schedules` bin — будут дубли.
   *
   * В админке коллекция видна (`hidden: false`), группа «Лента».
   */
  jobs: {
    tasks: [SyncVkPostsTask, FetchPedigreeTask],
    autoRun: [
      {
        cron: '* * * * *', // каждую минуту чекаем queue
        allQueues: true,
      },
    ],
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      labels: { singular: 'Задача (job)', plural: 'Задачи (jobs)' },
      admin: {
        ...defaultJobsCollection.admin,
        hidden: false,
        group: 'Лента',
        description:
          'Фоновые задачи: синхронизация VK-постов, импорт родословной РКФ. Можно запустить вручную через «Run».',
      },
    }),
  },
  plugins: [
    /**
     * S3-совместимое хранилище для Media → VK Object Storage.
     *
     * - Bucket: `veo55` (VK Cloud, регион ru-msk).
     * - Public CDN: `https://cdn.veo55.ru/<key>` — переопределено через `generateFileURL`.
     *   По дефолту Payload отдавал бы прямой S3-URL (hb.ru-msk.vkcloud-storage.ru), но у проекта
     *   уже настроен CDN-домен поверх того же бакета, отдаём ссылки через него.
     * - Prefix `media/` отделяет загрузки CMS от исторических ассетов в бакете
     *   (legacy лежит в `images/<date>/...`, его не трогаем).
     * - Креды берутся из env (Infisical в проде, .env.local в dev).
     */
    s3Storage({
      collections: {
        media: {
          // `prefix` тут НЕ задаём — пусть полностью контролирует поле
          // `Media.prefix` из админки (default 'media'). Иначе collection-level
          // префикс склеивается через `useCompositePrefixes` и получается
          // `media/media/<filename>` для дефолтных аплоадов.
          generateFileURL: ({ filename, prefix }) =>
            `https://cdn.veo55.ru/${prefix ? prefix + '/' : ''}${filename}`,
        },
      },
      bucket: process.env.S3_BUCKET ?? 'veo55',
      // ACL public-read — иначе CDN отдаёт 403 (объекты приватные по дефолту).
      // VK Object Storage поддерживает стандартные S3 ACL.
      acl: 'public-read',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        region: process.env.S3_REGION ?? 'ru-msk',
        endpoint: process.env.S3_ENDPOINT ?? 'https://hb.ru-msk.vkcloud-storage.ru',
        forcePathStyle: true,
      },
    }),
  ],
});
