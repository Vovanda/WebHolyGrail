import type { CollectionConfig } from 'payload';

/**
 * Tags — generic тэги для Articles (M:N через Article.tags).
 *
 * @remarks
 * Цвет (`color`) опционален — задаётся как design-token name (`accent`,
 * `success`, `vk`, и т.п.) или hex. UI primitive `TagChip` использует это
 * для backdrop, fallback на `bg-surface`.
 */
export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Тэг', plural: 'Тэги' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'slug', 'color'],
    group: 'Блог',
    description: 'Тематические тэги для статей. Цвет для chip-backdrop опционально.',
  },
  fields: [
    {
      name: 'label',
      label: 'Название',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Часть URL: /blog/tag/<slug>.' },
    },
    {
      name: 'color',
      label: 'Цвет',
      type: 'text',
      admin: {
        description:
          'Design-token name (accent, success, vk, …) ИЛИ hex. Опционально — пусто = bg-surface.',
      },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      admin: { description: 'Опционально — показывается на /blog/tag/<slug> вверху.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && typeof data.label === 'string') {
          data.slug = data.label
            .toLowerCase()
            .replace(/[^\w\sЀ-ӿ-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 40);
        }
        return data;
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
};
