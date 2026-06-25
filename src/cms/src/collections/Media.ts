import type { CollectionConfig } from 'payload';

/**
 * Media — загруженные файлы (картинки и документы).
 *
 * @remarks
 * Хранилище — S3 (VK Object Storage `veo55` bucket), подключается через плагин
 * `@payloadcms/storage-s3` в `payload.config.ts`. По доке плагина — он
 * автоматически выставляет `disableLocalStorage: true` для подключённой
 * коллекции, поэтому `staticDir` тут НЕ указан (если оставить — Payload
 * пишет локальную копию параллельно S3, и потом отдаёт её через `/api/media/...`
 * перекрывая CDN-URL).
 *
 * Производные размеры (`imageSizes`) рендерятся sharp при загрузке. Имена
 * вариантов совпадают с ключами `MediaDoc.sizes` в `contracts`.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медиа' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize'],
    group: 'Контент',
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
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
      label: 'Альтернативный текст',
      type: 'text',
      required: true,
      admin: {
        description:
          'Описывает содержимое картинки для скринридеров и поисковиков. Не оставлять пустым.',
      },
    },
    {
      // Имя `prefix` — конвенция `@payloadcms/storage-s3` (он читает поле
      // именно с таким slug-ом, доп-настройки не нужны). Label — «Папка».
      name: 'prefix',
      label: 'Папка в bucket (опц.)',
      type: 'text',
      defaultValue: 'media',
      admin: {
        description:
          'Подпапка внутри S3 bucket — например `litters/2026-04-14-n` для фото помёта Н. Дефолт `media` (без подпапки). С `useCompositePrefixes` итоговый key = `<этот prefix>/<filename>`.',
        position: 'sidebar',
      },
    },
    {
      name: 'caption',
      label: 'Подпись (опционально)',
      type: 'text',
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
     * Cache-busting через `?v=<updatedAt>` к публичному URL.
     *
     * Проблема: VK CDN (`cdn.veo55.ru`) держит файлы с долгим TTL по Etag.
     * Если файл на S3 заменён под тем же ключом (Володя загрузил новую версию
     * напрямую в bucket или через админку при том же filename) — CDN edge
     * продолжает отдавать старую копию из своего кеша.
     *
     * Хук добавляет `?v=<timestamp>` к `url` и каждому `sizes.*.url`. Любое
     * обновление записи Media в Payload меняет `updatedAt` → меняется
     * query-string → CDN edge тянет свежий файл с S3 (query — часть cache-key).
     *
     * Side-effect для контрибьюторов: если файл правится прямо на S3 без
     * сохранения Media через админку — busting не сработает (`updatedAt` не
     * изменился). В этом случае: открыть запись Media в /admin → нажать
     * «Сохранить» (touch updatedAt) → CDN подхватит новую версию.
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
  },
};
