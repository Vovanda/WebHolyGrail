import type { CollectionConfig } from 'payload';

import { generateShortCode } from '../lib/video/short-code';

/**
 * Playlists — наборы роликов: курсы, циклы, подборки.
 *
 * @remarks
 * Набор — это список и ничего больше: он не меняет доступ входящих роликов.
 * Каскад «закрытый набор закрывает свои ролики» намеренно не делается — он
 * сделал бы невозможным платный курс с бесплатным вводным уроком, а это
 * основной способ курс продать.
 *
 * Что открывает закрытые ролики — право на набор (`entitlements`): оплатил,
 * получил подарок или промокод, и все закрытые уроки внутри открылись разом.
 *
 * Имя функциональное (R5++): курс тренера и цикл статей автора — один и тот
 * же набор с разным содержимым.
 */
export const Playlists: CollectionConfig = {
  slug: 'playlists',
  labels: { singular: 'Набор', plural: 'Наборы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'access', 'updatedAt'],
    group: 'Видео',
    description: 'Курсы и подборки роликов. Доступ к закрытым урокам даёт право на набор.',
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
       * Короткий адрес набора: `/@<автор>/p/<код>`.
       *
       * @remarks
       * Как и у ролика: по номеру наборы перебираются подряд. Выдаётся один
       * раз — ссылка на курс уходит в рассылки и рекламу, и переезд адреса
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
      admin: { description: 'Показывается на странице набора и в поисковой выдаче.' },
    },
    {
      name: 'cover',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
    },
    {
      /**
       * Автор набора — он же продавец.
       *
       * @remarks
       * Курсы ведёт не только владелец сайта: у тренера и у других участников
       * свои наборы, и статистику каждый видит только по своим.
       */
      name: 'author',
      label: 'Автор',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'access',
      label: 'Видимость набора',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Открыт всем', value: 'public' },
        { label: 'Не в списках, только по ссылке', value: 'unlisted' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Видимость самого набора. На доступ к урокам не влияет: закрытые уроки открывает право на набор.',
      },
    },
    {
      name: 'items',
      label: 'Ролики',
      type: 'array',
      labels: { singular: 'Ролик', plural: 'Ролики' },
      admin: { description: 'Порядок здесь — порядок просмотра.' },
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
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && !data['shortCode']) {
          data['shortCode'] = generateShortCode();
        }
        // Автор проставляется сам, но остаётся изменяемым: набор может вести
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
    // Править набор может его автор или администратор: тренер не должен
    // трогать чужой курс.
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
