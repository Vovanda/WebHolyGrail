import type { Block } from 'payload';

/**
 * ThreadsSection — секция серий на любой странице (R5++).
 *
 * @remarks
 * Парный к `ArticlesSection`: тот показывает записи, этот — сами журналы.
 * Нужен, когда у сайта несколько параллельных серий и на странице ожидается их
 * перечень: объекты подрядчика с ходом работ по каждому, рубрики дневника,
 * линейки продуктов. До этого блока такую страницу приходилось собирать
 * вручную — по одной «Секции статей» на каждую серию, и каждая новая серия
 * требовала правки страницы.
 *
 * Имя функциональное, не доменное (R5++): «Наши работы» у подрядчика и
 * «Циклы статей» у блога — один и тот же блок с разным заголовком. Сама
 * выборка живёт в клиентском компоненте, блок хранит только параметры (R0).
 */
export const ThreadsSectionBlock: Block = {
  slug: 'threads-section',
  labels: { singular: 'Секция серий', plural: 'Секции серий' },
  fields: [
    {
      name: 'title',
      label: 'Заголовок секции',
      type: 'text',
      admin: { description: 'Например «Наши работы». Пусто — секция без заголовка.' },
    },
    {
      name: 'description',
      label: 'Подзаголовок',
      type: 'textarea',
    },
    {
      name: 'source',
      label: 'Что показывать',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'Все серии', value: 'all' },
        { label: 'Выбрать вручную', value: 'manual' },
      ],
      admin: {
        description: 'Все серии — новая появится на странице сама, править её не придётся.',
      },
    },
    {
      name: 'items',
      label: 'Серии',
      type: 'relationship',
      relationTo: 'threads',
      hasMany: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'manual',
        description: 'Порядок карточек — как здесь.',
      },
    },
    {
      name: 'limit',
      label: 'Сколько показать',
      type: 'number',
      defaultValue: 12,
      min: 1,
      max: 48,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'all',
        description: 'Сначала те, у кого свежее последняя запись.',
      },
    },
    {
      name: 'layout',
      label: 'Вид',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Плитки с обложками', value: 'grid' },
        { label: 'Компактные строки', value: 'list' },
      ],
    },
    {
      name: 'hideEmpty',
      label: 'Прятать серии без записей',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Заведённый, но пока пустой объект не будет висеть на витрине.',
      },
    },
    {
      name: 'cta',
      label: 'Ссылка под секцией',
      type: 'group',
      fields: [
        { name: 'label', label: 'Текст', type: 'text' },
        { name: 'href', label: 'Адрес', type: 'text' },
      ],
    },
  ],
};
