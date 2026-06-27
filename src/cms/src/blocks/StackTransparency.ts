import type { Block } from 'payload';

/**
 * StackTransparency — ряд иконок технологий стека с подписями.
 *
 * Tip для админа: «открытка стека» — что под капотом. Используется вместо
 * trust-bar (логотипы клиентов) когда клиентов ещё нет. 5-7 иконок в ряд
 * оптимально, на mobile wrap.
 */
export const StackTransparencyBlock: Block = {
  slug: 'stack-transparency',
  labels: { singular: 'Стек технологий', plural: 'Стеки технологий' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции',
      type: 'text',
      defaultValue: 'Что под капотом',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (1 предложение)',
      type: 'text',
      defaultValue: 'Решения зафиксированы — фокусируйтесь на продукте.',
    },
    {
      name: 'items',
      label: 'Технологии',
      type: 'array',
      minRows: 3,
      maxRows: 10,
      admin: {
        description: '5-7 элементов оптимально. Иконка — emoji или название lucide-иконки.',
      },
      fields: [
        { name: 'icon', label: 'Иконка (emoji или lucide-имя)', type: 'text', required: true },
        { name: 'label', label: 'Название', type: 'text', required: true },
        { name: 'href', label: 'Ссылка (опционально)', type: 'text' },
      ],
    },
  ],
};
