import type { Block } from 'payload';

/**
 * WaveDivider — декоративный разделитель между секциями. Variants:
 *  - wave    — волнистая SVG-линия (default)
 *  - line    — прямая accent-полоса
 *  - dots    — ряд точек (геометрия)
 *  - gradient — fade-out полоса от border к transparent
 */
export const WaveDividerBlock: Block = {
  slug: 'wave-divider',
  labels: { singular: 'Разделитель', plural: 'Разделители' },
  fields: [
    {
      name: 'variant',
      label: 'Вид разделителя',
      type: 'select',
      defaultValue: 'wave',
      options: [
        { label: 'Волна (тонкая, две линии)', value: 'wave' },
        { label: 'Прямая линия (accent)', value: 'line' },
        { label: 'Точки (геометрический ряд)', value: 'dots' },
        { label: 'Градиентный fade', value: 'gradient' },
      ],
    },
    {
      name: 'flipped',
      label: 'Зеркально по вертикали (только для волны)',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Для чередования между разделителями на странице.' },
    },
  ],
};
