import { APIError, type CollectionConfig } from 'payload';

import { generateShortCode } from '../lib/video/short-code';

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
      // Показывает обложку и состояние нарезки вместо штатного превью: после
      // нарезки исходник удаляется, и Payload рисует крестик — человек читает
      // это как «видео пропало» и идёт перезаливать.
      name: 'videoPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '/admin/components/VideoPreviewField#VideoPreviewField',
        },
      },
    },
    {
      /**
       * Короткий адрес ролика: `/@автор/v/<код>`.
       *
       * @remarks
       * Номер медиафайла в адрес не годится — по нему ролики перебираются
       * подряд, и закрытые обнаруживаются простым увеличением числа. Заодно
       * номер выдаёт, сколько всего загружено.
       *
       * Код выдаётся один раз и не меняется: ссылка расходится по мессенджерам
       * и поисковой выдаче, переезд адреса её обнулит.
       */
      name: 'shortCode',
      label: 'Код в адресе',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
      },
    },
    {
      /**
       * Кто залил файл.
       *
       * @remarks
       * Это факт, а не право: заполняется само из текущего пользователя и
       * руками не меняется. Права даёт роль — отдельно.
       *
       * Нужно для канала (`/@автор`), для области хранения и для того, чтобы
       * каждый участник видел статистику только по своему. Проставляется
       * сразу, а не «когда понадобится»: расставлять авторство задним числом
       * по накопившемуся архиву будет нечем.
       */
      name: 'uploadedBy',
      label: 'Загрузил',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
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
          // Кнопка возврата рядом с пометкой: срок отсрочки бессмыслен, если
          // вернуть ролик можно только запросом в базу.
          name: 'restore',
          type: 'ui',
          admin: {
            components: {
              Field: '/admin/components/RestoreVideoField#RestoreVideoField',
            },
          },
        },
        {
          /**
           * Пометка удаления.
           *
           * @remarks
           * Ролик пропадает с сайта сразу, а файлы стираются отложенно: удаление —
           * единственное необратимое действие, потому что оригинала уже нет.
           * Отсрочка превращает «нажал не туда» из катастрофы в мелочь.
           */
          name: 'deletedAt',
          label: 'Помечен к удалению',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Ролик скрыт с сайта. Файлы будут стёрты по истечении срока из настроек.',
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
     * Проставляет автора при загрузке.
     *
     * @remarks
     * Только при создании: у существующего файла автор не меняется, даже если
     * запись правит кто-то другой. Иначе первая же правка чужой подписи
     * переписала бы историю загрузок.
     */
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data['uploadedBy']) {
          data['uploadedBy'] = req.user.id;
        }
        // Код выдаём только видео и только один раз: у остальных файлов
        // своей страницы нет, а у существующего ролика адрес не меняется.
        if (
          operation === 'create' &&
          !data['shortCode'] &&
          String(data['mimeType'] ?? '').startsWith('video/')
        ) {
          data['shortCode'] = generateShortCode();
        }
        return data;
      },
    ],

    /**
     * Удаление видео — пометка, а не стирание.
     *
     * @remarks
     * Оригинал стёрт сразу после нарезки, восстановить ролик неоткуда. Поэтому
     * «удалить» означает скрыть: с сайта он пропадает немедленно, а файлы лежат
     * до срока из настроек и уходят отдельной задачей.
     *
     * Картинок и документов это не касается — они удаляются как раньше.
     */
    beforeDelete: [
      async ({ id, req, context }) => {
        // Уборщик стирает по истечении срока — ему перехват не нужен.
        if (context?.['skipDeleteGuard']) return;
        const doc = (await req.payload.findByID({
          collection: 'media',
          id,
          depth: 0,
          overrideAccess: true,
        })) as { mimeType?: string; hls?: { deletedAt?: string | null } };

        if (!String(doc?.mimeType ?? '').startsWith('video/')) return;
        // Уже помечен — значит стирает задача уборки, ей мешать не нужно.
        if (doc?.hls?.deletedAt) return;

        await req.payload.update({
          collection: 'media',
          id,
          data: { hls: { deletedAt: new Date().toISOString() } },
          context: { skipHlsQueue: true },
        });

        // APIError, а не обычная ошибка: иначе Payload отвечает «Something went
        // wrong», и человек не понимает, удалилось вообще или нет.
        throw new APIError(
          'Ролик скрыт с сайта. Файлы будут стёрты автоматически по истечении срока из настроек — до тех пор его можно вернуть.',
          400,
        );
      },
    ],

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
