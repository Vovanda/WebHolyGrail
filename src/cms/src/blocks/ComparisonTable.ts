import type { Block } from 'payload';

/**
 * ComparisonTable — две колонки с pros/cons сравнения (left vs right).
 *
 * Tip для админа: чаще всего «как у всех» (red, ✗) vs «как у нас» (green, ✓).
 * 3-4 пункта в каждой колонке оптимально — больше будет перегружать восприятие.
 */
export const ComparisonTableBlock: Block = {
  slug: 'comparison-table',
  labels: { singular: 'Сравнение (red vs green)', plural: 'Сравнения' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции',
      type: 'text',
      defaultValue: 'Большинство сайтов заканчиваются тупиком',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'leftLabel',
          label: 'Заголовок левой колонки (отрицательный путь)',
          type: 'text',
          defaultValue: 'Обычный путь',
        },
        {
          name: 'rightLabel',
          label: 'Заголовок правой колонки (наш путь)',
          type: 'text',
          defaultValue: 'С Web Holy Grail',
        },
      ],
    },
    {
      name: 'leftItems',
      label: 'Левая колонка — пункты со знаком ✗',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'rightItems',
      label: 'Правая колонка — пункты со знаком ✓',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
};
