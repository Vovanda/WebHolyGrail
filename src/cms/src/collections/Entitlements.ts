import type { CollectionConfig } from 'payload';

/**
 * Entitlements — право зрителя на плейлист.
 *
 * @remarks
 * Отдельная связь «зритель × плейлист», а не флаг на видео и не свойство
 * плейлиста. Так платный плейлист может содержать открытое начало: оно доступно
 * само по себе, а закрытое открывает право на плейлист.
 *
 * Способ выдачи модели безразличен — оплата, подарок, промокод или рука
 * администратора. Когда появится платёжка, она встанет сюда же и ни плеер,
 * ни нарезка об этом не узнают.
 */
export const Entitlements: CollectionConfig = {
  slug: 'entitlements',
  labels: { singular: 'Доступ', plural: 'Доступы' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['viewer', 'playlist', 'source', 'expiresAt'],
    group: 'Медиа',
    description: 'Кому открыт какой плейлист. Выдаётся оплатой, ссылкой, промокодом или вручную.',
  },
  fields: [
    {
      name: 'viewer',
      label: 'Учётная запись',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        description: 'Пусто, пока доступ выдан на телефон или почту и человек ещё не входил.',
      },
    },
    {
      /**
       * Телефон, на который выдан доступ.
       *
       * @remarks
       * Номер и есть опознание: учётная запись необязательна. С нового
       * устройства человек вводит свой телефон, получает код и возвращает
       * доступ сам, не обращаясь к продавцу.
       *
       * Хранится в едином виде — только цифры: человек пишет номер как
       * придётся, и без приведения тот же телефон не совпал бы сам с собой.
       */
      name: 'phone',
      label: 'Телефон',
      type: 'text',
      index: true,
    },
    {
      name: 'email',
      label: 'Почта',
      type: 'email',
      index: true,
      admin: { description: 'Второй способ опознания, если кода прислали письмом.' },
    },
    {
      name: 'playlist',
      label: 'Плейлист',
      type: 'relationship',
      relationTo: 'playlists',
      required: true,
      index: true,
    },
    {
      name: 'source',
      label: 'Чем выдан',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Вручную', value: 'manual' },
        { label: 'Оплата', value: 'payment' },
        { label: 'Ссылка-приглашение', value: 'invite' },
        { label: 'Промокод', value: 'promo' },
      ],
      admin: { description: 'Нужно, чтобы понимать, откуда пришёл доступ, когда придёт биллинг.' },
    },
    {
      /**
       * До какой даты действует.
       *
       * @remarks
       * Пусто — бессрочно. Срок нужен подаркам и акциям: «дать посмотреть
       * курс на неделю» без него превращается в «отдать курс насовсем».
       */
      name: 'expiresAt',
      label: 'Действует до',
      type: 'date',
      admin: {
        description: 'Пусто — навсегда.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
      },
    },
    {
      name: 'note',
      label: 'Пометка',
      type: 'text',
      admin: { description: 'Для себя: за что выдан доступ.' },
    },
  ],
  access: {
    // Свои доступы видит сам зритель, чужие — администратор и автор плейлиста.
    // Иначе список покупателей чужого плейлиста читался бы кем угодно.
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { viewer: { equals: user.id } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
