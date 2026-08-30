import type { Block } from 'payload';

/**
 * Каталог специалистов — витрина людей по городам.
 *
 * @remarks
 * Города берутся из справочника, специалисты — из своих карточек; в блоке
 * настраивается только подача. Пока людей мало, порядок случайный: так
 * никто не оказывается вечно первым просто потому, что завёлся раньше.
 */
export const SpecialistDirectoryBlock: Block = {
  slug: 'specialist-directory',
  labels: { singular: 'Витрина специалистов', plural: 'Витрины специалистов' },
  fields: [
    {
      name: 'view',
      label: 'Что показывать',
      type: 'select',
      required: true,
      defaultValue: 'people',
      options: [
        { label: 'Людей — карточки специалистов', value: 'people' },
        { label: 'Города — сколько в каждом и куда перейти', value: 'cities' },
        { label: 'Топ с переключателем городов', value: 'top' },
      ],
      admin: {
        description:
          'На главной уместна витрина: несколько человек или города. Полный список с фильтрами — отдельная страница.',
      },
    },
    { name: 'heading', label: 'Заголовок', type: 'text', defaultValue: 'Специалисты' },
    {
      name: 'description',
      label: 'Пояснение',
      type: 'textarea',
      admin: { description: 'Строка под заголовком: кого здесь можно найти.' },
    },
    {
      name: 'onlyAccepting',
      label: 'Только те, кто принимает клиентов',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Занятые специалисты останутся на сайте и по прямой ссылке, но в этой подборке не появятся.',
      },
    },
    {
      name: 'order',
      label: 'Порядок',
      type: 'select',
      defaultValue: 'random',
      options: [
        { label: 'Случайный — никто не в приоритете', value: 'random' },
        { label: 'По рейтингу — оценка, надбавка и заявки', value: 'ranked' },
        { label: 'По алфавиту', value: 'alphabet' },
      ],
      admin: {
        description:
          'Случайный уместен, пока специалистов мало: любой стабильный порядок читается как «этот главный».',
      },
    },
    {
      name: 'limit',
      label: 'Сколько показывать',
      type: 'number',
      defaultValue: 12,
      admin: { description: 'Остальные останутся доступны через страницу города.' },
    },
    {
      name: 'showCities',
      label: 'Разбивать по городам',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Заголовок города над каждой группой. Для витрины обычно не нужен, для полного списка — да.',
        condition: (_, siblingData) => siblingData?.['view'] !== 'cities',
      },
    },
    {
      name: 'moreLabel',
      label: 'Ссылка на полный список',
      type: 'text',
      defaultValue: 'Все специалисты',
      admin: { description: 'Пусто — ссылки не будет.' },
    },
    {
      name: 'moreHref',
      label: 'Адрес полного списка',
      type: 'text',
      defaultValue: '/specialists',
    },
    {
      name: 'emptyText',
      label: 'Если никого нет',
      type: 'text',
      defaultValue: 'Скоро здесь появятся специалисты.',
    },
    {
      name: 'defaultCity',
      label: 'Город по умолчанию',
      type: 'relationship',
      relationTo: 'cities',
      admin: {
        condition: (_, siblingData) => siblingData?.['view'] === 'top',
        description:
          'Показывается, если город посетителя определить не удалось или в нём ещё нет специалистов.',
      },
    },
  ],
};
