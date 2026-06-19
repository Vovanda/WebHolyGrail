import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { ru } from '@payloadcms/translations/languages/ru';
import { en } from '@payloadcms/translations/languages/en';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { FormSubmissions } from './collections/FormSubmissions';
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
  },
  collections: [Users, Media, Pages, FormSubmissions],
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
  }),
  i18n: {
    supportedLanguages: { ru, en },
    fallbackLanguage: 'ru',
  },
  sharp,
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3001',
  cors: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'],
  csrf: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'],
});
