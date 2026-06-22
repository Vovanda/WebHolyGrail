import type { CollectionConfig } from 'payload';

/**
 * Dogs — собаки питомника: производители и выпускники с собственными карточками.
 *
 * @remarks
 * **Что НЕ Dogs:** щенки активного помёта на витрине — это `Litters.puppies[]`
 * (nested array), не отдельные записи здесь. Запись в Dogs появляется только
 * когда собака остаётся в питомнике как производитель или показывается на сайте
 * самостоятельно. Это убирает дублирование: 10 щенков одного помёта = 1 запись
 * Litters, а не 10 записей Dogs (см. контракт `@veo55/contracts/dogs`).
 *
 * **Окрасы.** На старте — ВЕО-набор (cheprachny/zonarny/cherny). При расширении
 * на другие породы переедет в `SiteSettings` (Globals).
 */
export const Dogs: CollectionConfig = {
  slug: 'dogs',
  labels: { singular: 'Собака', plural: 'Собаки питомника' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sex', 'color', 'dob', 'updatedAt'],
    group: 'Питомник',
    description:
      'Производители и выпускники, у которых есть отдельная карточка на сайте. Щенков из активного помёта добавлять не сюда, а внутрь записи Помёта.',
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'name',
      label: 'Кличка',
      type: 'text',
      required: true,
    },
    {
      name: 'aliases',
      label: 'Прозвища и сокращения',
      type: 'array',
      labels: { singular: 'Прозвище', plural: 'Прозвища' },
      admin: {
        description:
          'По которым тоже подсвечиваем в VK-постах. Например: «Марта» для «ОМСКАЯ ДРУЖИНА МАРТА». Регистр игнорируется.',
      },
      fields: [
        {
          name: 'alias',
          label: 'Прозвище',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'slug',
      label: 'URL (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Часть URL после /dog/. Латиница, цифры, дефисы.',
      },
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
    },
    {
      name: 'dob',
      label: 'Дата рождения',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
      },
    },
    {
      name: 'color',
      label: 'Окрас',
      type: 'select',
      options: [
        { label: 'Чепрачный', value: 'cheprachny' },
        { label: 'Зонарный', value: 'zonarny' },
        { label: 'Чёрный', value: 'cherny' },
      ],
    },
    {
      name: 'photos',
      label: 'Фотографии',
      type: 'array',
      labels: { singular: 'Фото', plural: 'Фото' },
      admin: {
        description: 'Первая фотография — главная (используется в превью).',
      },
      fields: [
        {
          name: 'image',
          label: 'Фото',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'titles',
      label: 'Регалии',
      type: 'array',
      labels: { singular: 'Регалия', plural: 'Регалии' },
      admin: {
        description:
          'Каждая регалия — отдельная строка (CACIB, Чемпион РФ, рабочий класс и т.п.). Порядок отображения = порядок в списке.',
      },
      fields: [
        {
          name: 'text',
          label: 'Текст регалии',
          type: 'text',
          required: true,
        },
        {
          name: 'year',
          label: 'Год',
          type: 'number',
          min: 1900,
          max: 2100,
        },
        {
          name: 'place',
          label: 'Место / организация',
          type: 'text',
          admin: {
            description: 'Город и название мероприятия, либо организация.',
          },
        },
      ],
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'richText',
      admin: {
        description:
          'Подробный рассказ о собаке. Отображается на её странице и опционально в карточке помёта (по флагу).',
      },
    },
    {
      name: 'pedigreeUrl',
      label: 'Ссылка на родословную',
      type: 'text',
      admin: {
        description: 'PDF родословной или страница в базе РКФ. Опционально.',
      },
    },
    {
      name: 'rkfId',
      label: 'РКФ-id',
      type: 'number',
      index: true,
      admin: {
        description:
          'id записи в veorkf.ru/catalog/dog.php?id=N. Нужен для импорта родословной и для линковки с РКФ-карточкой.',
      },
    },
    {
      name: 'kennel',
      label: 'Питомник',
      type: 'text',
      admin: {
        description:
          'Заполняется только если собака не из «Омской Дружины» (например, привозной кобель-производитель).',
      },
    },
    {
      name: 'breeder',
      label: 'Заводчик',
      type: 'text',
      admin: {
        description: 'ФИО заводчика. Заполняется когда отличается от Ольги Зайцевой.',
      },
    },
    {
      name: 'pedigree',
      label: 'Родословная',
      type: 'array',
      labels: { singular: 'Предок', plural: 'Предки' },
      admin: {
        description:
          'Заполняется автоматически сидером seed:fetch-pedigree из РКФ по rkfId. Позиции: 1=отец, 2=дед по отцу, 3-4=прадеды линии отца-отца, 5=бабка по отцу, 6-7=прадеды линии отца-матери, 8=мать, 9-14 симметрично по матери.',
      },
      fields: [
        { name: 'position', type: 'number', required: true, min: 1, max: 14 },
        { name: 'rkfId', type: 'number' },
        { name: 'name', type: 'text', required: true },
        { name: 'note', type: 'text' },
      ],
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { _status: { equals: 'published' } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
