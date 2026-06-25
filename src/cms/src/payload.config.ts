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
import { Posts } from './collections/Posts';
import { Comments } from './collections/Comments';
import { FaqGroups } from './collections/FaqGroups';
import { SiteSettings } from './globals/SiteSettings';

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
 * Generic CMS-фичи (Posts/Comments) включены по дефолту — удалите если
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
  },
  collections: [Users, Media, Pages, FormSubmissions, ReusableBlocks, Posts, Comments, FaqGroups],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI ?? 'file:./data/site.db',
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
  sharp,
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
     * S3-совместимое хранилище для Media — **обязательное**.
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
  ],
});
