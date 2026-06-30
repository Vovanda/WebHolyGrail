import type { CollectionConfig } from 'payload';

/**
 * Threads — серия связанных Articles (one-to-many через Article.thread).
 *
 * @remarks
 * Ghost не имеет встроенных threads, это наша добавка для long-form блогов
 * с series-структурой ("Stage 0 → N", "Holy Grail journey", и т.п.).
 *
 * UI:
 *  - /blog/thread/<slug> рендерит ThreadCard hero + ThreadPostList
 *  - Внутри Article-страницы — sticky-блок "Из той же серии" с siblings
 */
export const Threads: CollectionConfig = {
  slug: 'threads',
  labels: { singular: 'Тред', plural: 'Треды' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'updatedAt'],
    group: 'Блог',
    description: 'Серия связанных статей. Article.thread → Thread.',
  },
  fields: [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Часть URL: /blog/thread/<slug>. Авто из title.' },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
    },
    {
      name: 'cover',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Опубликовано', value: 'published' },
      ],
      defaultValue: 'draft',
      index: true,
    },
    {
      name: 'order',
      label: 'Порядок (если не по дате)',
      type: 'number',
      admin: {
        description:
          'Опционально. Если задан — Articles в этом треде сортируются по полю Article.threadPosition. ' +
          'Если пусто — по publishedAt ASC.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && typeof data.title === 'string') {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^\w\sЀ-ӿ-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 80);
        }
        return data;
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { status: { equals: 'published' } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
};
