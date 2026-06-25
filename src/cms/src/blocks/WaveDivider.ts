import type { Block } from 'payload';

/**
 * WaveDivider — декоративный волнистый разделитель между секциями.
 * Без полей, чисто визуальный.
 */
export const WaveDividerBlock: Block = {
  slug: 'wave-divider',
  labels: { singular: 'Разделитель (волна)', plural: 'Разделители' },
  fields: [
    {
      name: 'flipped',
      label: 'Зеркально по вертикали',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Для чередования между разделителями на странице.' },
    },
  ],
};
