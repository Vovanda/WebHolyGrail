import type { CollectionConfig } from 'payload';

/**
 * Pages — страницы сайта из блоков.
 *
 * @remarks
 * Инвариант (см. memo `HolyGrail/38`). Страница = `slug` + дерево блоков + SEO.
 * Поле `blocks` сейчас пустое (`blocks: []`) — конкретные блоки заводятся в
 * Шаге 4 (Hero, RichText, Gallery, CTA, Form, Contacts, ...). Тогда же
 * добавится drag-n-drop их порядка прямо в админке.
 *
 * Slug пустой (`''`) допускается и означает главную страницу.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Страницы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Контент',
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'title',
      label: 'Заголовок',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'URL (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Часть URL после домена. Главная — пустая строка. Без ведущего слэша.',
      },
    },
    {
      name: 'blocks',
      label: 'Блоки страницы',
      type: 'blocks',
      // Будет наполнен в Шаге 4 (Hero, RichText, Gallery, CTA, Form, Contacts...).
      // Пустой массив — валидно в Payload, поле появляется в админке как пустой
      // блок-конструктор без вариантов выбора блока.
      blocks: [],
    },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'title', label: 'Title (переопределить)', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
        {
          name: 'ogImage',
          label: 'OG-image (для соцсетей)',
          type: 'upload',
          relationTo: 'media',
        },
        { name: 'canonical', label: 'Canonical URL', type: 'text' },
        {
          name: 'noindex',
          label: 'Скрыть от поисковиков (noindex, nofollow)',
          type: 'checkbox',
        },
      ],
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      // Авторизованные видят drafts, публика — только published.
      if (user) return true;
      return { _status: { equals: 'published' } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
