import type { CollectionConfig } from 'payload';

/**
 * Comments — generic-коллекция комментов к социал-постам (R5++).
 * Источник через `source` (VK / TG / IG), per-источник `sourceId` уникален.
 *
 * @remarks
 * Замыкание на пост через `post` relation (на коллекцию `posts`) + плоский
 * `parentId` (`'0'` для top-level, `<id>` для reply). Дерево replies
 * собирается на client при рендере (одна выборка по `postId`, группировка
 * по `parentId` в памяти).
 *
 * Наполняется сидером `pnpm sync:vk-posts` (заодно с постами). Заводчик
 * комменты не редактирует — read-only в админке кроме `hidden`-флага.
 *
 * Unique: `(source, sourceId)` — чтобы re-sync не дублировал.
 */
export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: { singular: 'Коммент (соц-сеть)', plural: 'Комменты (соц-сети)' },
  admin: {
    useAsTitle: 'previewTitle',
    defaultColumns: ['source', 'date', 'authorName', 'likes', 'post'],
    group: 'Лента',
    description:
      'Комменты к постам из соц-сетей. Подкачиваются автоматически вместе с постом — синхронизация через sync:vk-posts.',
  },
  fields: [
    {
      name: 'source',
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
      label: 'ID коммента на источнике',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'post',
      label: 'Пост',
      type: 'relationship',
      relationTo: 'social-posts',
      required: true,
      index: true,
    },
    {
      name: 'sourceOwnerId',
      label: 'ID владельца ленты',
      type: 'text',
    },
    {
      name: 'parentId',
      label: 'Parent comment ID',
      type: 'text',
      defaultValue: '0',
      admin: { description: '"0" для top-level, иначе id родительского коммента (reply).' },
    },
    {
      name: 'date',
      label: 'Дата (unix-секунды)',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'dateIso',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'text',
      type: 'textarea',
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
      name: 'likes',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'hidden',
      label: 'Скрыть на сайте',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Ручной флаг заводчика. Если включён — коммент не показывается на сайте (но в БД остаётся, чтобы при следующем sync не вернулся).',
      },
    },
    {
      name: 'previewTitle',
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
