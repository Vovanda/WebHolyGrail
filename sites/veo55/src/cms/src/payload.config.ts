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
import { SiteSettings } from './globals/SiteSettings';

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
  collections: [Users, Media, Pages, FormSubmissions, Dogs, Litters, ReusableBlocks, Posts],
  globals: [SiteSettings],
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
  cors: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'],
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
          prefix: 'media',
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
