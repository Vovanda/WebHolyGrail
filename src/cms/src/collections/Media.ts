import type { CollectionConfig } from 'payload';

import { renderPdfPreview } from '../lib/pdf-preview';

/**
 * Media — uploaded files (images and documents).
 *
 * @remarks
 * Storage is S3-compatible (any provider — AWS S3, Cloudflare R2, Backblaze B2,
 * MinIO, etc.) wired in `payload.config.ts` via `@payloadcms/storage-s3`. The
 * plugin automatically sets `disableLocalStorage: true` for the attached
 * collection, so `staticDir` is intentionally absent here (leaving it on would
 * make Payload also write a local copy and serve it via `/api/media/...`, which
 * would override the CDN URL).
 *
 * Derived image sizes are produced by sharp on upload. The variant names match
 * the keys of `MediaDoc.sizes` in `contracts`.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медиафайл', plural: 'Медиа' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize'],
    group: 'Контент',
  },
  upload: {
    // Видео наравне с картинками: обложка с роликом на фоне и съёмка с объекта —
    // обычный контент, а владелец сайта не должен ради этого идти к разработчику
    // или заливать файл в чужое хранилище мимо админки.
    //
    // Производные размеры и перевод в webp применяются только к изображениям —
    // видео и PDF сохраняются как есть.
    // Предельный размер файла задаётся не здесь, а в nginx
    // (`client_max_body_size` в `deploy/prod/nginx/`): загрузка упирается в
    // прокси раньше, чем доходит до приложения.
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 768, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
    ],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
  },
  fields: [
    {
      name: 'alt',
      label: 'Описание (alt)',
      type: 'text',
      // Не `required`, а проверка по типу файла: у видео и документов alt-текста
      // нет, и требовать его — заставлять человека выдумывать строку, лишь бы
      // форма сохранилась.
      validate: (value: unknown, { data }: { data?: { mimeType?: string } }) => {
        const mime = data?.mimeType ?? '';
        if (mime.startsWith('image/') && !String(value ?? '').trim()) {
          return 'Опишите, что на изображении — это читают скринридеры и поисковики.';
        }
        return true;
      },
      admin: {
        description:
          'Что изображено. Читают скринридеры и поисковики. Для видео и документов можно оставить пустым.',
      },
    },
    {
      name: 'preview',
      label: 'Превью',
      type: 'upload',
      relationTo: 'media',
      admin: {
        readOnly: true,
        description:
          'Для PDF собирается само из первой страницы при загрузке. Заполнять вручную не нужно.',
      },
    },
    {
      // The field name `prefix` is the convention of `@payloadcms/storage-s3` (it
      // reads the field with exactly that slug, no extra setup needed).
      name: 'prefix',
      label: 'Bucket folder (optional)',
      type: 'text',
      defaultValue: 'media',
      admin: {
        description:
          'Sub-folder inside the S3 bucket. Default `media` (no sub-folder). With `useCompositePrefixes` the resulting key is `<this prefix>/<filename>`.',
        position: 'sidebar',
      },
    },
    {
      name: 'caption',
      label: 'Caption (optional)',
      type: 'text',
    },
    {
      name: 'access',
      label: 'Кто может смотреть',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Все', value: 'public' },
        { label: 'Только авторизованные', value: 'private' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description:
          'Переключается в любой момент: видео зашифровано в обоих режимах, меняется только то, кому выдаётся ключ. Перенарезка не требуется.',
      },
    },
    {
      name: 'hls',
      label: 'Потоковое видео',
      type: 'group',
      admin: {
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description: 'Заполняется само после нарезки. Руками менять не нужно.',
      },
      fields: [
        {
          name: 'status',
          label: 'Состояние',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'В очереди', value: 'pending' },
            { label: 'Нарезается', value: 'processing' },
            { label: 'Готово', value: 'ready' },
            { label: 'Ошибка', value: 'failed' },
          ],
          admin: { readOnly: true },
        },
        {
          name: 'playlistUrl',
          label: 'Плейлист',
          type: 'text',
          admin: { readOnly: true, description: 'Адрес master.m3u8 — его открывает плеер.' },
        },
        {
          // Хранится отдельно от адреса плейлиста: у закрытого видео это
          // случайный UUID, и по номеру медиафайла его уже не вычислить, а
          // чистить прошлую нарезку при перезаливке по чему-то надо.
          name: 'prefix',
          label: 'Папка в хранилище',
          type: 'text',
          admin: { readOnly: true, hidden: true },
        },
        {
          name: 'qualities',
          label: 'Качества',
          type: 'array',
          admin: { readOnly: true },
          fields: [{ name: 'height', type: 'number' }],
        },
        {
          name: 'durationSeconds',
          label: 'Длительность, с',
          type: 'number',
          admin: { readOnly: true },
        },
        {
          // Секрет держим в базе, а не в хранилище: иначе он лежал бы рядом
          // с сегментами и шифрование не защищало бы ни от чего.
          name: 'secret',
          label: 'Секрет потока',
          type: 'text',
          admin: { readOnly: true, hidden: true },
          access: {
            // Секрет не приезжает в выдачу API вместе с документом — за ним
            // ходят в отдельный эндпоинт, который решает, кому можно. Здесь
            // его не видит никто, включая администратора.
            read: () => false,
          },
        },
        {
          name: 'error',
          label: 'Причина ошибки',
          type: 'textarea',
          admin: {
            readOnly: true,
            condition: (_data, siblingData) => siblingData?.status === 'failed',
          },
        },
      ],
    },
  ],
  access: {
    read: () => true, // Публичный URL для медиа — без авторизации.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    /**
     * Cache-busting via `?v=<updatedAt>` appended to the public URL.
     *
     * Problem: many CDNs keep objects with a long TTL keyed by Etag. If the file
     * at S3 is replaced under the same key (re-uploaded through the admin with
     * the same filename, or written directly to the bucket out-of-band), the CDN
     * edge keeps serving the old copy from its cache.
     *
     * This hook appends `?v=<timestamp>` to `url` and to each `sizes.*.url`. Any
     * update of the Media record in Payload bumps `updatedAt` → the query string
     * changes → the CDN edge fetches the fresh file from S3 (the query string is
     * part of the cache key).
     *
     * Side-effect: if a file is replaced directly on S3 without saving the Media
     * record through the admin, busting will not trigger (`updatedAt` is
     * unchanged). In that case open the Media record in `/admin` and click Save
     * (touches `updatedAt`) so the CDN picks up the new version.
     */
    afterRead: [
      ({ doc }) => {
        if (!doc?.url) return doc;
        const v = doc.updatedAt ? new Date(doc.updatedAt as string | Date).getTime() : Date.now();
        const bust = (url: unknown): unknown => {
          if (typeof url !== 'string' || !url) return url;
          return url + (url.includes('?') ? '&' : '?') + `v=${v}`;
        };
        const sizes = doc.sizes as Record<string, { url?: unknown }> | undefined;
        return {
          ...doc,
          url: bust(doc.url),
          ...(sizes
            ? {
                sizes: Object.fromEntries(
                  Object.entries(sizes).map(([k, s]) => [k, { ...s, url: bust(s?.url) }]),
                ),
              }
            : {}),
        };
      },
    ],

    /**
     * Нарезка загруженного видео ставится в очередь сама.
     *
     * @remarks
     * От человека в админке не требуется ничего, кроме «выбрать файл»: кнопок
     * «подготовить видео» нет и быть не должно — про них забывают, и ролик
     * молча остаётся неиграбельным.
     *
     * Ставится только на загрузку файла, а не на любое сохранение: правка
     * подписи или переключение доступа перенарезки не требуют. Признак —
     * наличие `req.file`; служебные обновления самой задачи помечены
     * `context.skipHlsQueue`, иначе запись результата запустила бы новый круг.
     */
    afterChange: [
      async ({ doc, req, context }) => {
        if (context?.['skipHlsQueue']) return doc;
        if (!req.file) return doc;
        if (!String(doc?.mimeType ?? '').startsWith('video/')) return doc;

        try {
          await req.payload.jobs.queue({
            task: 'build-hls',
            input: { mediaId: String(doc.id) },
          });
          await req.payload.update({
            collection: 'media',
            id: doc.id as string | number,
            data: { hls: { status: 'pending', error: null } },
            context: { skipHlsQueue: true },
          });
        } catch (error) {
          // Файл уже сохранён — ронять загрузку из-за очереди нельзя.
          // Нарезку можно запустить кнопкой в списке задач.
          req.payload.logger.error(
            `[media] не удалось поставить нарезку для ${doc.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
        return doc;
      },

      /**
       * Превью первой страницы для загруженного PDF.
       *
       * @remarks
       * Документы на сайте показываются плиткой с картинкой. Раньше её готовили
       * руками и заливали отдельным файлом: лишний шаг, о котором забывают, и
       * превью разъезжается с документом после его замены.
       *
       * Работает после создания, а не до: файл к этому моменту уже сохранён, и
       * сбой рендера не мешает загрузить сам документ. Превью кладём отдельным
       * медиафайлом и связываем — так оно попадает в то же хранилище и получает
       * тот же CDN-адрес, что и всё остальное.
       */
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc;
        if (doc?.mimeType !== 'application/pdf' || doc?.preview) return doc;

        const data = req.file?.data;
        if (!data) return doc;

        const preview = await renderPdfPreview(data as Buffer);
        if (!preview) return doc;

        try {
          const base = String(doc.filename ?? 'document').replace(/\.pdf$/i, '');
          const created = await req.payload.create({
            collection: 'media',
            data: { alt: `Первая страница документа «${base}»`, prefix: 'previews' },
            file: {
              data: preview,
              name: `${base}-preview.webp`,
              mimetype: 'image/webp',
              size: preview.length,
            },
          });
          await req.payload.update({
            collection: 'media',
            id: doc.id as string | number,
            data: { preview: created.id },
          });
          return { ...doc, preview: created.id };
        } catch {
          // Документ уже сохранён — превью не критично, добавится при повторной загрузке.
          return doc;
        }
      },
    ],
  },
};
