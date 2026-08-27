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
import { ReusableBlocks } from './collections/ReusableBlocks';
import { SocialPosts } from './collections/SocialPosts';
import { Comments } from './collections/Comments';
import { FaqGroups } from './collections/FaqGroups';
import { Articles } from './collections/Articles';
import { Threads } from './collections/Threads';
import { Tags } from './collections/Tags';
import { Authors } from './collections/Authors';
import { Cities } from './collections/Cities';
import { Specialists } from './collections/Specialists';
import { Playlists } from './collections/Playlists';
import { Entitlements } from './collections/Entitlements';
import { AccessCodes } from './collections/AccessCodes';
import { SiteSettings } from './globals/SiteSettings';
import { withAutoSlug } from './lib/slug';
import { BuildHlsTask } from './jobs/build-hls.task';
import { PurgeVideosTask } from './jobs/purge-videos.task';
import {
  videoAccessEndpoint,
  videoByCodeEndpoint,
  videoChannelEndpoint,
  videoPlaylistEndpoint,
  videoPlaylistByIdEndpoint,
  videoEnvelopeEndpoint,
  videoTokenEndpoint,
  videoRedeemEndpoint,
  videoDemoCodeEndpoint,
} from './endpoints/video';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Жёсткий контракт на env-переменные storage. Если не задана — fail-fast с
 * понятным сообщением вместо тихого падения позже на upload.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env "${name}". ` +
        `Configure S3 storage via Infisical (dev по умолчанию — MinIO ` +
        `localhost:9000, см. dev-setup.sh) или установи cloud S3 (Backblaze ` +
        `B2 / Cloudflare R2 / AWS S3). docs/whg/37-scaffolding.md`,
    );
  }
  return value;
}

/**
 * Origin'ы для cors/csrf: CSV из env (`PAYLOAD_ALLOWED_ORIGINS`) + дефолтные
 * локальные. Дедуп по строке. При работе через демо-туннель / прод-домен —
 * добавляйте в `PAYLOAD_ALLOWED_ORIGINS`.
 */
function parseOrigins(csv: string | undefined, fallback: string): string[] {
  const fromEnv = (csv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [fallback, 'http://localhost:3000', 'http://localhost:3001'];
  return Array.from(new Set([...defaults, ...fromEnv]));
}

/**
 * Payload config — generic Holy Grail template.
 *
 * - Admin UI на русском (fallback ru, en подключён).
 * - SQLite-адаптер: визитке/лендингу/блогу хватает. Меняется на Postgres
 *   через `@payloadcms/db-postgres` без изменений в схеме.
 * - Lexical-editor — современный rich-text.
 * - sharp — обработка картинок при загрузке Media.
 * - S3-storage — generic adapter (VK Cloud / Yandex / S3 / R2 — endpoint в env).
 *
 * Доменные коллекции (Dogs/Patients/Vehicles/Menu/...) добавляйте здесь же.
 * Generic CMS-фичи (SocialPosts/Comments) включены по дефолту — удалите если
 * не нужны для конкретного сайта.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: process.env.SITE_NAME ? ` — ${process.env.SITE_NAME}` : ' — Holy Grail',
    },
    importMap: {
      baseDir: dirname,
    },
    components: {
      // Напоминание об уведомлении Роскомнадзора — висит, пока владелец не
      // отметит, что подал его. Убирается только галочкой в настройках.
      beforeDashboard: ['/admin/components/ComplianceNotice#ComplianceNotice'],
    },
  },
  /**
   * Порядок здесь задаёт порядок разделов в админке.
   *
   * @remarks
   * Сверху то, куда заходят каждый день, снизу служебное. Поэтому первым идёт
   * контент, за ним обращения от посетителей: непрочитанная заявка стоит
   * дороже, чем ненаписанная статья. Настройки и учётные записи — последними:
   * их трогают редко, а место наверху они занимали постоянно.
   */
  collections: [
    // Контент — то, из чего состоит сайт.
    Pages,
    Media,
    ReusableBlocks,
    FaqGroups,
    // Обращения — то, ради чего сайт обычно и заводят.
    FormSubmissions,
    // Блог (#43): Articles, Threads, Tags, Authors. Имя `Articles` постоянное —
    // слот `posts` свободен (после #49), но `articles` конкретнее отражает функцию.
    Articles,
    Threads,
    Tags,
    Authors,
    // Доступ к видео: плейлисты видео, права на них и коды, которые эти права
    // выдают. Сами видео лежат в медиа — здесь только управление доступом.
    Playlists,
    Entitlements,
    AccessCodes,
    // Каталог специалистов по городам (тренеры, мастера, врачи).
    Cities,
    Specialists,
    SocialPosts,
    Comments,
    Users,
  ].map(withAutoSlug),
  globals: [SiteSettings],
  /**
   * Выдача доступа к видео. Живёт рядом с коллекциями, а не внутри `media`:
   * токен зрителя к конкретному медиафайлу не относится, он общий на сессию.
   */
  endpoints: [
    videoTokenEndpoint,
    videoRedeemEndpoint,
    videoDemoCodeEndpoint,
    videoDemoCodeEndpoint,
    videoRedeemEndpoint,
    videoDemoCodeEndpoint,
    videoDemoCodeEndpoint,
    videoByCodeEndpoint,
    videoChannelEndpoint,
    videoPlaylistEndpoint,
    videoPlaylistByIdEndpoint,
    videoPlaylistByIdEndpoint,
    videoAccessEndpoint,
    videoEnvelopeEndpoint,
  ],
  /**
   * Jobs Queue — admin UI на /admin/collections/payload-jobs. Template поставляет
   * пустой плейлист tasks/workflows — downstream добавляет свои задачи (sync
   * соц-сетей, генерация отчётов, периодические синки). Воркер запускается через
   * `pnpm payload jobs:run` или встроенный autoRun (см. whg-payload-jobs skill).
   *
   * jobsCollectionOverrides — кастомизация admin UI коллекции payload-jobs:
   * русские labels + group 'Администрирование', чтобы downstream видел "Задачи"
   * рядом с "Редакторы" вместо скрытой технической collection.
   */
  jobs: {
    tasks: [BuildHlsTask, PurgeVideosTask],
    // Один воркер за раз: ffmpeg живёт на той же машине, что и сайт, и
    // параллельное кодирование нескольких видео придушит выдачу страниц.
    autoRun: [{ cron: '* * * * *', allQueues: true, limit: 1 }],
    workflows: [],
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      labels: { singular: 'Задача (job)', plural: 'Задачи (jobs)' },
      admin: {
        ...defaultJobsCollection.admin,
        hidden: false,
        group: 'Администрирование',
        description:
          'Фоновые задачи. Template не поставляет tasks из коробки — downstream добавляет свои в payload.config.jobs.tasks. См. whg-payload-jobs skill.',
      },
    }),
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI ?? 'file:./data/site.db',
      // Шифрование файла базы. В базе лежат заявки с сайта — имя, телефон,
      // почта, — то есть персональные данные, и на диске они не должны
      // храниться открытым текстом.
      //
      // Ключ живёт в Infisical рядом с остальными секретами инстанса. Потерять
      // его значит потерять базу: без ключа файл не открывается, в этом и смысл.
      // Существующую базу переводит `scripts/encrypt-db.mjs` — зашифровать файл
      // на месте нельзя, ключ задаётся при открытии.
      ...(process.env.DATABASE_ENCRYPTION_KEY
        ? { encryptionKey: process.env.DATABASE_ENCRYPTION_KEY }
        : {}),
    },
    // Drizzle push выключен: схема меняется только через миграции.
    // Workflow — `.claude/skills/payload-migration/SKILL.md`.
    push: false,
    migrationDir: path.resolve(dirname, '../migrations'),
  }),
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'ru',
  },
  // Payload типизирует sharp как SharpDependency, реальный экспорт типа `typeof sharp` —
  // известный type mismatch в payload@3.85.x, runtime-совместим.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharp: sharp as any,
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3001',
  cors: parseOrigins(
    process.env.PAYLOAD_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  csrf: parseOrigins(
    process.env.PAYLOAD_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  plugins: [
    /**
     * S3-совместимое хранилище для Media.
     *
     * Подключается **только если задан `S3_BUCKET`**. Docker-build и CLI-команды
     * (`payload migrate:create`, `generate:types`) идут без S3-env — при жёстком
     * требовании они падали бы на пустых переменных. В prod-runtime env приходит
     * из Infisical, и плагин активируется.
     *
     * Holy Grail работает на S3 от day 1 — dev (MinIO в Docker) и prod
     * (любой S3 провайдер) используют один и тот же storage layer. Это
     * избавляет от painful миграции "local-disk → S3" с пересозданием URL.
     *
     * Env (через Infisical):
     *  - `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`
     *  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
     *  - `S3_PUBLIC_URL` — публичный base (CDN или прямой S3-endpoint)
     *
     * Dev по умолчанию: MinIO на localhost:9000, bucket `local-media`,
     * креды `minioadmin/minioadmin`. Поднимается через `pnpm minio:up`
     * (вызывается из `dev-setup.sh` автоматически при первом запуске).
     *
     * Prod: настрой облачный S3 через Infisical UI (см. SKILL
     * `holygrail-infisical`).
     */
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: {
              media: {
                generateFileURL: ({ filename, prefix }) => {
                  const base = process.env.S3_PUBLIC_URL ?? '';
                  return `${base}/${prefix ? prefix + '/' : ''}${filename}`;
                },
              },
            },
            bucket: requireEnv('S3_BUCKET'),
            acl: 'public-read',
            config: {
              credentials: {
                accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
                secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
              },
              region: requireEnv('S3_REGION'),
              endpoint: requireEnv('S3_ENDPOINT'),
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
});
