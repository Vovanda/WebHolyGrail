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
 *
 * First-user safety: поле `role` скрыто в first-user wizard, а beforeChange hook
 * форсит role='admin' если это самый первый пользователь в БД. Без этого можно
 * было бы создать редактора и лишить систему единственного админа (некому потом
 * заводить новых пользователей — access.create ждёт admin).
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
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation !== 'create') return data;
        const existing = await req.payload.count({ collection: 'users' });
        if (existing.totalDocs === 0) {
          return { ...data, role: 'admin' };
        }
        return data;
      },
    ],
  },
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
      defaultValue: 'admin',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Редактор', value: 'editor' },
      ],
      admin: {
        description: 'Администратор — полный доступ. Редактор — только контент.',
        // First-user wizard: user ещё не залогинен → скрываем выбор роли,
        // beforeChange hook форсит admin для самого первого пользователя.
        condition: (_data, _siblingData, { user }) => Boolean(user),
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
