import type { CollectionConfig } from 'payload';

/**
 * Media — загруженные файлы (картинки и документы).
 *
 * @remarks
 * Инвариант (см. memo `HolyGrail/38`). На старте — локальный диск через volume.
 * Когда подключим S3 — добавится `s3Adapter` через `@payloadcms/storage-s3`.
 *
 * Производные размеры (`imageSizes`) рендерятся sharp при загрузке. Имена
 * вариантов совпадают с ключами `MediaDoc.sizes` в `@veo55/contracts`.
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
    staticDir: 'media',
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
};
