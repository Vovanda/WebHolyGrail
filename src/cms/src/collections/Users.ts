import type { CollectionConfig } from 'payload';

import { channelFrom, freeChannel } from '../lib/channel.js';

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
  /*
    Ключ рядом с паролем: пароль открывает админку человеку, ключ - наполнение
    сайта запросами. У ключа свой отзыв, и снять его можно, не трогая пароль.

    Payload заводит поля сам: включение, значение и его отпечаток. Запрос
    приходит с заголовком `Authorization: users API-Key <ключ>`.
  */
  auth: { useAPIKey: true },
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

    /**
     * Заполняет адрес канала, если участник его не задал.
     *
     * @remarks
     * Транслит имени, а при пустом имени — часть почты до собаки. Совпадения
     * разводим номером: адрес уникален, и без этого второй Иван Петров не
     * смог бы сохраниться вовсе.
     *
     * Заполняем и при создании, и при сохранении пустого: учётки, заведённые
     * до появления поля, остались без адреса, и канал у них не открывался
     * вовсе — владелец заливал видео и упирался в «страница не найдена».
     *
     * Заданный адрес не трогаем никогда, даже если сменилось имя: ссылки на
     * канал уже разошлись.
     */
    beforeValidate: [
      async ({ req, operation, data }) => {
        if (!data || data['channel']) return data;
        if (operation !== 'create' && operation !== 'update') return data;

        data['channel'] = await freeChannel(req, channelFrom(data['name'], data['email']));
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
      /**
       * Имя канала в адресе: `/@<канал>`.
       *
       * @remarks
       * Отдельно от `name`: имя человека меняется свободно, а адрес канала —
       * это ссылка, которая уже разошлась. Заполняется само транслитом имени
       * при первом сохранении, дальше правится руками осознанно.
       *
       * Хранилище на него не завязано: файлы лежат под номером участника,
       * поэтому переименование канала не трогает ни один сегмент.
       */
      name: 'channel',
      label: 'Адрес канала',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Часть адреса: /@<канал>. Менять после того, как ссылки разошлись, не стоит.',
      },
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
