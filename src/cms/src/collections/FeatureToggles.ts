import type { CollectionConfig } from 'payload';

import { forgetToggles } from '../lib/toggles/source';

/**
 * Переключатели возможностей.
 *
 * @remarks
 * Признак описывается один раз, а значение получает отдельно для каждого
 * окружения: на пробном сайте новое включают раньше, чем на рабочем.
 *
 * Держим значения в базе, а не в переменных окружения. Переменная вида
 * `NEXT_PUBLIC_*` вшивается в сборку, поэтому «включить без выкладки» через неё
 * не работает - это и подтолкнуло завести переключатели.
 *
 * Коллекция - хранилище, а не источник правды для приложения: читает и пишет
 * его прослойка, а сайт спрашивает у неё. Так админку можно заменить, не трогая
 * ни сайт, ни значения.
 */
export const FeatureToggles: CollectionConfig = {
  slug: 'feature-toggles',
  labels: { singular: 'Переключатель', plural: 'Переключатели' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'key', 'group', 'production', 'updatedAt'],
    group: 'Настройки',
    description: 'Что включено на сайте. Меняется здесь и доходит до сайта без выкладки.',
  },
  fields: [
    {
      name: 'title',
      label: 'Название',
      type: 'text',
      required: true,
      admin: { description: 'Человеческое имя: «Новый плеер», «Комментарии под видео».' },
    },
    {
      name: 'key',
      label: 'Признак',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Имя, по которому его спрашивает код: например video.player-vidstack.',
      },
    },
    {
      name: 'group',
      label: 'Фича',
      type: 'text',
      index: true,
      admin: {
        description:
          'Чем объединены признаки: «видео», «блог», «оплата». По ней они собираются в списке.',
      },
    },
    {
      name: 'description',
      label: 'Что включает',
      type: 'textarea',
      admin: { description: 'Что изменится на сайте, если включить.' },
    },

    /*
      Значения по окружениям. Отдельными полями, а не списком: их всего три, и
      в списке пришлось бы каждый раз разворачивать строку, чтобы увидеть, что
      где включено.
    */
    {
      type: 'row',
      fields: [
        {
          name: 'production',
          label: 'На рабочем сайте',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'staging',
          label: 'На пробном',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'development',
          label: 'У разработчика',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },

    {
      name: 'enableAt',
      label: 'Включить в назначенное время',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Признак включится сам, когда время придёт. Пусто - решают галочки выше.',
      },
    },

    {
      name: 'source',
      label: 'Откуда значение',
      type: 'select',
      defaultValue: 'local',
      options: [
        { label: 'Заведён здесь', value: 'local' },
        { label: 'Пришёл из хранилища секретов', value: 'infisical' },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Пришедшие извне видны рядом со своими, чтобы список был полным.',
      },
    },
    {
      name: 'changedBy',
      label: 'Кто менял',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        // Свод в памяти забываем сразу: владелец нажал переключатель и ждёт,
        // что сайт изменится теперь, а не через полминуты.
        forgetToggles();
        return doc;
      },
    ],
    afterDelete: [
      ({ doc }) => {
        forgetToggles();
        return doc;
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        // Кто трогал переключатель, видно без разбирательств: включение и
        // выключение меняют сайт для всех сразу.
        if (req.user) data['changedBy'] = req.user.id;
        return data;
      },
    ],
  },
  access: {
    // Читают все: значения нужны и сайту, и админке. Секретов здесь нет -
    // признак говорит лишь о том, включена ли возможность.
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
