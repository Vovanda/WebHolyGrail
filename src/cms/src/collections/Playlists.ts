import type { CollectionConfig } from 'payload';

import { generateShortCode } from '../lib/video/short-code';

/**
 * Playlists — плейлисты видео: подборки, циклы, серии.
 *
 * @remarks
 * Плейлист — это список и ничего больше: он не меняет доступ входящих видео.
 * Каскад «закрытый плейлист закрывает свои видео» намеренно не делается — он
 * запретил бы платной подборке иметь открытое начало, а именно оно и приводит
 * зрителя к остальному.
 *
 * Что открывает закрытые видео — право на плейлист (`entitlements`): оплатил,
 * получил подарок или промокод, и всё закрытое внутри открылось разом.
 *
 * Имя функциональное (R5++): подборка мастер-классов, серия репортажей со
 * стройки и цикл видео автора — один и тот же плейлист с разным содержимым.
 */
export const Playlists: CollectionConfig = {
  slug: 'playlists',
  labels: { singular: 'Плейлист', plural: 'Плейлисты' },
  admin: {
    useAsTitle: 'title',
    // Первой идёт обычная колонка: на ней Payload сам рисует ссылку на запись.
    defaultColumns: ['title', 'cover', 'author', 'visibility', 'updatedAt'],
    group: 'Медиа',
    description: 'Подборки видео. Доступ к закрытым из них даёт право на плейлист.',
  },
  fields: [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      required: true,
    },
    {
      /**
       * Короткий адрес плейлиста: `/@<автор>/p/<код>`.
       *
       * @remarks
       * Как и у видео: по номеру плейлисты перебираются подряд. Выдаётся один
       * раз — ссылка на плейлист уходит в рассылки и рекламу, и переезд адреса
       * обнулил бы её.
       */
      name: 'shortCode',
      label: 'Код в адресе',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      admin: { description: 'Показывается на странице плейлиста и в поисковой выдаче.' },
    },
    {
      name: 'cover',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
      admin: {
        components: {
          Cell: '/admin/components/PlaylistCoverCell#PlaylistCoverCell',
        },
      },
    },
    {
      /**
       * Автор плейлиста — он же продавец.
       *
       * @remarks
       * Плейлисты ведёт не только владелец сайта: у каждого участника свои, и
       * статистику каждый видит только по своим.
       */
      name: 'author',
      label: 'Автор',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'applyAccessToItems',
      label: 'Применить ко всем видео',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Не трогать', value: 'none' },
        { label: 'Закрыть все видео', value: 'private' },
        { label: 'Открыть все видео', value: 'public' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Разовое действие при сохранении: доступ каждого видео плейлиста станет таким. Дальше их можно править по одной.',
      },
    },
    {
      /**
       * Попадает ли подборка в списки.
       *
       * @remarks
       * Та же ось, что у видео, и названа так же: витрина набирается решением,
       * а не накоплением. Раньше на канал попадала каждая заведённая подборка.
       *
       * Прежняя настройка «не в списках, только по ссылке» отсюда убрана:
       * значение объявлялось, но не читалось ни одним запросом, то есть выбор
       * между двумя её пунктами ничего не менял. Скрытая подборка теперь
       * скрыта на деле, а не на словах, и по ссылке открывается по-прежнему.
       */
      name: 'visibility',
      label: 'Публикация',
      type: 'select',
      defaultValue: 'hidden',
      options: [
        { label: 'Опубликовано', value: 'published' },
        { label: 'Скрыто', value: 'hidden' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Видна ли подборка в списках канала. Доступа к видео не касается: закрытые отпираются правом на подборку.',
      },
    },
    {
      name: 'items',
      label: 'Видео в плейлисте',
      type: 'array',
      labels: { singular: 'Видео', plural: 'Видео' },
      admin: {
        description: 'Порядок здесь — порядок просмотра.',
        components: {
          // В свёрнутой строке — кадр и название вместо «Видео 01»: два похожих
          // видео иначе не различить, не открыв каждый.
          RowLabel: '/admin/components/PlaylistItemRowLabel#PlaylistItemRowLabel',
        },
      },
      fields: [
        {
          name: 'video',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: () => ({ mimeType: { like: 'video' } }),
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      /*
        Массовое закрытие и открытие видео плейлиста.

        Курс продают плейлистом, а доступ у каждого видео свой: закрывать их по
        одной - долгая ручная работа, в которой легко пропустить урок и отдать
        его даром.

        Действие разовое, рукой автора: правилом «плейлист закрыт - значит закрыты
        все видео» связать нельзя, потому что видео живёт и вне плейлиста, а
        первый урок часто оставляют открытым нарочно.
      */
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update') return doc;

        const applyTo = (doc as { applyAccessToItems?: string | null }).applyAccessToItems;
        if (!applyTo || applyTo === 'none') return doc;
        // Отметка разовая: иначе каждое сохранение плейлиста заново переписывало
        // бы доступ у видео, отменяя ручные правки автора.
        if ((previousDoc as { applyAccessToItems?: string | null })?.applyAccessToItems === applyTo)
          return doc;

        const items = ((doc as { items?: ReadonlyArray<{ video?: unknown }> }).items ?? [])
          .map((item) => item?.video)
          .map((video) =>
            typeof video === 'object' && video ? (video as { id?: string | number }).id : video,
          )
          .filter((id): id is string | number => id !== undefined && id !== null);

        for (const id of items) {
          await req.payload.update({
            collection: 'media',
            id,
            data: { access: applyTo === 'private' ? 'private' : 'public' },
            // Служебное обновление: смена доступа нарезку не трогает, видео
            // зашифровано в обоих случаях.
            context: { skipHlsQueue: true },
            overrideAccess: true,
          });
        }

        // Отметку сбрасываем: она означает «сделай сейчас», а не состояние.
        await req.payload.update({
          collection: 'playlists',
          id: doc.id,
          data: { applyAccessToItems: 'none' },
          context: { skipHlsQueue: true },
          overrideAccess: true,
        });

        return doc;
      },
    ],
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && !data['shortCode']) {
          data['shortCode'] = generateShortCode();
        }
        // Автор проставляется сам, но остаётся изменяемым: плейлист может вести
        // не тот, кто его завёл.
        if (operation === 'create' && req.user && !data['author']) {
          data['author'] = req.user.id;
        }
        return data;
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    // Править плейлист может его автор или администратор: участник не должен
    // трогать чужой.
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { author: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { author: { equals: user.id } };
    },
  },
};
