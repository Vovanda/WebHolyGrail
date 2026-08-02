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
  labels: { singular: 'Каталог специалистов', plural: 'Каталоги специалистов' },
  fields: [
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
      label: 'Показывать переключатель городов',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Пока город один, переключатель можно убрать.' },
    },
    {
      name: 'emptyText',
      label: 'Если никого нет',
      type: 'text',
      defaultValue: 'Скоро здесь появятся специалисты.',
    },
  ],
};
