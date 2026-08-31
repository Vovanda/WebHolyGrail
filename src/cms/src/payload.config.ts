import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { ru } from '@payloadcms/translations/languages/ru';
import { en } from '@payloadcms/translations/languages/en';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { adoptEnvToggles } from './lib/toggles/adopt';
import { SiteSettings } from './globals/SiteSettings';
import { Users } from './collections/Users';
import { engineCollections } from './collections/engine';
// Каталог специалистов - ниша витрины, а не движка: сайту без специалистов
// эти коллекции пустой груз, и синк папку domain не обходит.
import { engineTasks } from './jobs/engine';
import { withAutoSlug } from './lib/slug';
import { engineEndpoints } from './endpoints/engine';
// Своё этого сайта - коллекции, ручки, задания, глобалы. Файл принадлежит
// сайту и обновлением не трогается; сам конфиг общий и приезжает целиком.
import { site } from './site';

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
 * Доменные коллекции сайта (собаки, пациенты, техника, меню) дописываются
 * в `collections` следом за набором движка:
 *
 * ```ts
 * collections: [...engineCollections, Dogs, Litters].map(withAutoSlug),
 * ```
 *
 * Разделы движка, которые сайту не нужны, отсюда не выкидываются - они прячутся
 * переключателем в рантайме.
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
  /*
    Точка сборки принадлежит сайту: сперва всё из движка, ниже своё доменное.

    Раньше список стоял здесь целиком, и это разъезжалось: общая коллекция
    появлялась в шаблоне, приезжала файлом, а в сборке сайта её не было -
    и проверка типов падала на ссылке из блока в несуществующую коллекцию.

    Порядок разделов админки задаёт сам набор движка; своё дописывается следом.
  */
  collections: [...engineCollections, ...site.collections].map(withAutoSlug),
  globals: [SiteSettings, ...site.globals],
  /*
    Ручки движка приходят набором целиком, своё дописывается следом. Тот же
    порядок, что у коллекций: приехавшая обновлением ручка попадает в сборку
    сама, и сайт не остаётся с нарезанным видео и ответом «маршрут не найден».

    Выдача доступа к видео живёт здесь, а не внутри `media`: токен зрителя
    к конкретному медиафайлу не относится, он общий на сессию.
  */
  endpoints: [...engineEndpoints, ...site.endpoints],

  /**
   * Признаки из хранилища секретов заводятся в списке при запуске: значение им
   * задаёт переменная, но видны они наравне с остальными.
   */
  onInit: async (payload) => {
    const added = await adoptEnvToggles(payload).catch(() => 0);
    if (added > 0) payload.logger.info(`Заведено переключателей из окружения: ${added}`);
  },
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
    // Сперва задания движка, ниже свои: набор ездит обновлением целиком.
    tasks: [...engineTasks, ...site.tasks],
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
  /*
    Панель редактора закреплена сверху, а не только всплывает по выделению:
    кнопка «добавить» на строке появляется по наведению мышью, которого на
    телефоне нет, и владелец остаётся без вставки записи, картинки и блока.
  */
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
  }),
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
      // Существующую базу переводит `pnpm --filter cms encrypt:db` — зашифровать файл
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
    /*
      Галку в списке Payload подписывает словами из `general.true` и
      `general.false`, а в русском словаре это «Правда» и «Ложь» - перевод
      логических значений, а не ответ на вопрос. В колонке «Требовать вход»
      выходит «Ложь», и владелец читает это как поломку, а не как «нет».

      Переопределяем в одном месте на весь шаблон: подписи полей у каждой
      коллекции свои, а слова под галкой одни и те же везде.
    */
    translations: {
      ru: { general: { true: 'Да', false: 'Нет' } },
    },
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
