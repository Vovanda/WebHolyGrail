import type { CollectionConfig } from 'payload';

/**
 * SocialPosts — коллекция социал-постов (R5++). Источник через поле
 * `source` (VK / Telegram / IG / …) с per-источником `sourceId`.
 *
 * @remarks
 * Наполняется автоматически сидером `pnpm sync:vk-posts` (см. адаптеры
 * `cms/src/lib/social/*`). Заводчик редко правит руками — кейс «отредактировать
 * текст» либо «отметить эксклюзив». В админке useAsTitle = preview из text.
 *
 * Unique: `(source, sourceId)` — чтобы re-sync не дублировал.
 *
 * Имя `Posts` зарезервировано за блог-collection (см. #45) — эта переименована
 * из `posts` slug → `social-posts` в refactor #49.
 */
export const SocialPosts: CollectionConfig = {
  slug: 'social-posts',
  labels: { singular: 'Пост (соц-сеть)', plural: 'Посты (соц-сети)' },
  admin: {
    useAsTitle: 'previewTitle',
    defaultColumns: ['source', 'date', 'previewTitle', 'metrics_likes', 'metrics_comments'],
    group: 'Лента',
    description:
      'Посты из соц-сетей (VK / Telegram). Наполняется автоматически — синхронизация запускается командой sync:vk-posts.',
  },
  fields: [
    {
      name: 'source',
      label: 'Источник',
      type: 'select',
      required: true,
      options: [
        { label: 'VK', value: 'vk' },
        { label: 'Telegram', value: 'tg' },
        { label: 'Instagram', value: 'ig' },
      ],
    },
    {
      name: 'sourceId',
      label: 'ID на источнике',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'sourceOwnerId',
      label: 'ID владельца ленты',
      type: 'text',
      admin: { description: 'VK — отрицательный для сообщества.' },
    },
    {
      name: 'sourceUrl',
      label: 'URL поста на источнике',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      label: 'Дата публикации (unix-секунды)',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'dateIso',
      label: 'Дата ISO',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'text',
      label: 'Текст',
      type: 'textarea',
    },
    {
      name: 'media',
      label: 'Медиа',
      type: 'array',
      labels: { singular: 'Медиа', plural: 'Медиа' },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Фото', value: 'photo' },
            { label: 'Видео', value: 'video' },
          ],
        },
        { name: 'url', type: 'text', required: true },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'duration', type: 'number' },
        { name: 'title', type: 'text' },
        { name: 'embedUrl', type: 'text' },
        { name: 'pageUrl', type: 'text' },
      ],
    },
    {
      name: 'author',
      label: 'Автор',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Пользователь', value: 'user' },
            { label: 'Сообщество', value: 'channel' },
          ],
        },
        { name: 'id', type: 'text' },
        { name: 'name', type: 'text' },
        { name: 'photo', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'mentions',
      label: 'Упоминания (mentions)',
      type: 'array',
      admin: {
        description:
          'Server-side извлечённые [id|name] / #hashtag / dog-mention из текста. Заполняется адаптером.',
      },
      fields: [
        { name: 'start', type: 'number', required: true },
        { name: 'end', type: 'number', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Профиль', value: 'profile' },
            { label: 'Хэштег', value: 'hashtag' },
            { label: 'Собака', value: 'dog' },
            { label: 'URL', value: 'url' },
          ],
        },
        { name: 'url', type: 'text', required: true },
        { name: 'display', type: 'text', required: true },
        { name: 'data', type: 'json' },
      ],
    },
    {
      name: 'metrics',
      label: 'Метрики',
      type: 'group',
      fields: [
        { name: 'likes', type: 'number', defaultValue: 0 },
        { name: 'comments', type: 'number', defaultValue: 0 },
        { name: 'reposts', type: 'number', defaultValue: 0 },
        { name: 'views', type: 'number', defaultValue: 0 },
      ],
    },
    {
      name: 'previewTitle',
      label: 'Превью для админки',
      type: 'text',
      admin: { readOnly: true, description: 'Автогенерится из первой строки текста.' },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const raw: string = (siblingData as { text?: string })?.text ?? '';
            const first = raw.split('\n')[0]?.trim() ?? '';
            return first ? first.slice(0, 80) : '(без текста)';
          },
        ],
      },
    },
    {
      name: 'syncedAt',
      label: 'Последняя синхронизация',
      type: 'date',
      admin: { readOnly: true },
    },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
};
