import type { CollectionConfig } from 'payload';

/**
 * Users — редакторы CMS (admin-домен).
 *
 * @remarks
 * Инвариант: это люди которые заходят в админку и правят контент сайта.
 * Внешние клиенты бизнеса (покупатели, владельцы, пациенты) — совершенно
 * другая сущность, живёт в нишевых коллекциях (Customers / Owners / Clients),
 * **не здесь**.
 *
 * Auth настроен по дефолту Payload (email + password). При запуске первого dev
 * Payload предложит создать первого admin через UI.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Редактор', plural: 'Редакторы' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
    group: 'Администрирование',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
    },
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор', value: 'editor' },
      ],
      admin: {
        description: 'Администратор — полный доступ. Редактор — только контент.',
      },
    },
  ],
  access: {
    // Все авторизованные читают список редакторов. Создавать/менять — только admin.
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
