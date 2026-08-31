import type { Block } from 'payload';

/**
 * BlockShowcase — карусель/grid превью готовых блоков template'а.
 *
 * Tip для админа: показывает «что есть в коробке» — Hero / Quote / Timeline / FAQ /
 * Form / Carousel. Каждая карточка — превью блока (миниатюра + название). Это
 * WHG-специфичный блок для landing'а — для downstream-сайтов не нужен.
 */
export const BlockShowcaseBlock: Block = {
  slug: 'block-showcase',
  labels: { singular: 'Showcase блоков (WHG)', plural: 'Showcase блоков' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции',
      type: 'text',
      defaultValue: 'Современный UI из коробки',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок',
      type: 'text',
      defaultValue: 'Готовые блоки на shadcn/ui + Tailwind + дизайн-токены.',
    },
    {
      name: 'items',
      label: 'Карточки блоков',
      type: 'array',
      minRows: 3,
      maxRows: 12,
      fields: [
        { name: 'label', label: 'Название блока', type: 'text', required: true },
        {
          name: 'preview',
          label: 'Preview-изображение (опционально)',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
  ],
};
