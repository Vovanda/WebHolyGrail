import type { CollectionConfig } from 'payload';

/**
 * Litters — помёты. Структурная единица разведения у ВЕО (литера Н, О, П…).
 *
 * @remarks
 * **Зачем отдельная сущность вместо плоских Puppies:** у помёта есть общие
 * поля (мама, папа, визитка, описание, флаги, статус), которые с плоским
 * Puppies дублировались бы в каждом из 8-10 щенков. Litters хранит их один
 * раз и связывает массивом nested puppies (см. контракт `@veo55/litters`).
 *
 * **Архивация целиком:** один клик `status = 'archived'` — помёт уходит со
 * страницы /puppies на /puppies/archive. `hidden` — не рендерится нигде.
 *
 * **«Нестандартная» секция помёта** (например рамка «отборное поведение
 * Чипсы»): кладётся **рядом** с блоком LitterCard на странице помёта в
 * `Pages.blocks[]` как обычный Prose/Quote. Сама коллекция остаётся простой,
 * гибкость — на уровне композиции страницы.
 */
export const Litters: CollectionConfig = {
  slug: 'litters',
  labels: { singular: 'Помёт', plural: 'Помёты' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'dob', 'status', 'updatedAt'],
    group: 'Питомник',
    description:
      'Помёт = группа щенков от одной пары. Заводится один раз на литеру (Н, О, П…). Щенки внутри — nested array, не отдельная коллекция.',
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
    },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'title',
      label: 'Заголовок помёта',
      type: 'text',
      required: true,
      admin: {
        description: 'Отображается в шапке секции помёта и в админ-списке.',
      },
    },
    {
      name: 'slug',
      label: 'URL (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Часть URL после /puppies/. Латиница, цифры, дефисы.',
      },
    },
    {
      name: 'dob',
      label: 'Дата рождения',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
      },
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Активный (на сайте)', value: 'active' },
        { label: 'В архиве', value: 'archived' },
        { label: 'Скрыт (черновик/не показывать)', value: 'hidden' },
      ],
      admin: {
        description:
          'Активный — отображается на /puppies и на главной (если выставлен). В архиве — попадает в /puppies/archive, не на главной. Скрыт — не отображается нигде.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'mother',
          label: 'Мать',
          type: 'relationship',
          relationTo: 'dogs',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'father',
          label: 'Отец',
          type: 'relationship',
          relationTo: 'dogs',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'pairCard',
      label: 'Визитка пары',
      type: 'group',
      admin: {
        description:
          'Графическая карточка пары родителей с регалиями (традиционно собирается в Canva). Можно несколько вариантов — отрисуются галереей. Пусто — карточка не показывается.',
      },
      fields: [
        {
          name: 'images',
          label: 'Картинки визитки',
          type: 'array',
          labels: { singular: 'Картинка', plural: 'Картинки' },
          admin: {
            description:
              'Одна или несколько визиток. Порядок отображения = порядок в списке. Первая считается основной для превью.',
          },
          fields: [
            {
              name: 'image',
              label: 'Файл',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          name: 'caption',
          label: 'Подпись под визиткой',
          type: 'text',
          admin: {
            description: 'Опционально. Краткие регалии пары / дата вязки / комментарий.',
          },
        },
      ],
    },
    {
      name: 'description',
      label: 'Описание помёта',
      type: 'richText',
      admin: {
        description: 'Текст под визиткой пары. Можно оставить пустым.',
      },
    },
    {
      type: 'collapsible',
      label: 'Что показывать о родителях',
      admin: {
        description:
          'Дополнительно к именам родителей в карточке помёта можно показать их регалии и описание (берётся из самих записей Собак). Удобно прятать длинное описание если оно дублирует визитку.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'showMotherTitles',
              label: 'Регалии матери',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '50%' },
            },
            {
              name: 'showMotherDescription',
              label: 'Описание матери',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'showFatherTitles',
              label: 'Регалии отца',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '50%' },
            },
            {
              name: 'showFatherDescription',
              label: 'Описание отца',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'puppies',
      label: 'Щенки',
      type: 'array',
      labels: { singular: 'Щенок', plural: 'Щенки' },
      admin: {
        description:
          'Карточки щенков на витрине. Порядок отображения = порядок в списке. Статус «Продан» по умолчанию скрыт с сайта, «Скрыт» — скрыт всегда.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Кличка / прозвище',
              type: 'text',
              admin: { width: '50%' },
            },
            {
              name: 'sex',
              label: 'Пол',
              type: 'select',
              required: true,
              options: [
                { label: 'Кобель', value: 'male' },
                { label: 'Сука', value: 'female' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'color',
              label: 'Окрас',
              type: 'select',
              options: [
                { label: 'Чепрачный', value: 'cheprachny' },
                { label: 'Зонарный', value: 'zonarny' },
                { label: 'Чёрный', value: 'cherny' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'state',
              label: 'Статус',
              type: 'select',
              required: true,
              defaultValue: 'available',
              options: [
                { label: 'Свободен', value: 'available' },
                { label: 'В брони', value: 'reserved' },
                { label: 'Продан', value: 'sold' },
                { label: 'Скрыт', value: 'hidden' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'photo',
          label: 'Фото щенка',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'notes',
          label: 'Заметка под карточкой',
          type: 'text',
          admin: {
            description: 'Короткая характеристика щенка. Опционально.',
          },
        },
      ],
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        and: [{ _status: { equals: 'published' } }, { status: { not_equals: 'hidden' } }],
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
