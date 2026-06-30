import type { CollectionConfig } from 'payload';

/**
 * Authors — авторы статей (M:1 с Article.author).
 *
 * @remarks
 * Опционально. Single-author блог может игнорировать collection — на UI
 * AuthorBadge не показывается если `Article.author` пустой и
 * `SiteSettings.blog.showAuthor === false`.
 *
 * Отдельная collection от Users (admin-пользователей CMS) намеренно: автор
 * статьи != редактор cms, у autor публичная карточка с bio + соцсетями.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'Автор', plural: 'Авторы' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'Блог',
    description: 'Авторы статей (публичная карточка). Не путать с Users — это admin/editor CMS.',
  },
  fields: [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Часть URL: /blog/author/<slug>.' },
    },
    {
      name: 'bio',
      label: 'Биография',
      type: 'textarea',
    },
    {
      name: 'avatar',
      label: 'Фото',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'links',
      label: 'Ссылки',
      type: 'array',
      admin: { description: 'Соц-сети, личный сайт и т.п.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'role',
      label: 'Роль / должность',
      type: 'text',
      admin: { description: 'Опционально — "Editor", "Founder", и т.п.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && typeof data.name === 'string') {
          data.slug = data.name
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
