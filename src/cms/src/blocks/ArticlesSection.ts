import type { Block } from 'payload';

/**
 * ArticlesSection — секция статей на любой странице (R5++).
 *
 * @remarks
 * Универсальный блок-витрина для коллекции `articles`. Позволяет собрать
 * главную (или любую посадочную) из готовых секций без кода — «Избранное»,
 * «Последнее», «Этапы проекта», «Статьи по теме» — это один и тот же блок
 * с разным `source`.
 *
 * Имя функциональное, не доменное: сайт-журнал стройки и tech-блог используют
 * его одинаково (R5++). Сама выборка живёт в клиентском компоненте — блок
 * хранит только параметры запроса (R0).
 */
export const ArticlesSectionBlock: Block = {
  slug: 'articles-section',
  labels: { singular: 'Секция статей', plural: 'Секции статей' },
  fields: [
    {
      name: 'title',
      label: 'Заголовок секции',
      type: 'text',
      admin: { description: 'Например «Избранное» или «Последние записи». Пусто — без заголовка.' },
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
      defaultValue: 'latest',
      options: [
        { label: 'Последние статьи', value: 'latest' },
        { label: 'По тегу', value: 'by-tag' },
        { label: 'Из серии (thread)', value: 'by-thread' },
        { label: 'Выбрать вручную', value: 'manual' },
      ],
      admin: {
        description:
          'Серия (thread) — то, что нужно для журнала этапов: все записи одного проекта по порядку.',
      },
    },
    {
      name: 'tag',
      label: 'Тег',
      type: 'relationship',
      relationTo: 'tags',
      admin: { condition: (_data, siblingData) => siblingData?.source === 'by-tag' },
    },
    {
      name: 'thread',
      label: 'Серия',
      type: 'relationship',
      relationTo: 'threads',
      admin: { condition: (_data, siblingData) => siblingData?.source === 'by-thread' },
    },
    {
      name: 'items',
      label: 'Статьи',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'manual',
        description: 'Порядок в списке = порядок вывода.',
      },
    },
    {
      name: 'limit',
      label: 'Сколько показать',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 50,
      admin: {
        condition: (_data, siblingData) => siblingData?.source !== 'manual',
      },
    },
    {
      name: 'sort',
      label: 'Сортировка',
      type: 'select',
      defaultValue: 'newest',
      options: [
        { label: 'Сначала новые', value: 'newest' },
        { label: 'Сначала старые', value: 'oldest' },
      ],
      admin: {
        condition: (_data, siblingData) => siblingData?.source !== 'manual',
        description: 'Для журнала этапов обычно нужны «сначала старые» — хронология работ.',
      },
    },
    {
      name: 'layout',
      label: 'Вид',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Сетка', value: 'grid' },
        { label: 'Список (компактный)', value: 'vertical' },
        { label: 'Первая крупно, остальные сеткой', value: 'featured-first' },
      ],
    },
    {
      name: 'cta',
      label: 'Ссылка «смотреть все»',
      type: 'group',
      fields: [
        { name: 'label', label: 'Подпись', type: 'text' },
        {
          name: 'href',
          label: 'Ссылка',
          type: 'text',
          admin: { description: 'Например /blog или /blog/thread/remont-2026.' },
        },
      ],
    },
  ],
};
