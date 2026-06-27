import type { Block } from 'payload';

/**
 * QuoteCycle — циклически меняет дизайн цитаты по таймеру (demo-фишка).
 *
 * Tip для админа: одна цитата с массивом variants. Автоматически переключается
 * каждые N миллисекунд. Используется для marketing-страниц чтобы показать
 * гибкость Quote-блока. Для обычных контентных страниц — обычный Quote-блок.
 */
export const QuoteCycleBlock: Block = {
  slug: 'quote-cycle',
  labels: { singular: 'Quote rotation (auto-switch variants)', plural: 'Quote rotations' },
  fields: [
    { name: 'body', label: 'Quote text', type: 'textarea', required: true },
    { name: 'author', label: 'Author', type: 'text', required: true },
    { name: 'role', label: 'Role / title', type: 'text' },
    { name: 'authorHref', label: 'Author link (опц.)', type: 'text' },
    {
      name: 'variants',
      label: 'Варианты дизайна для ротации',
      type: 'array',
      admin: {
        description: 'Минимум 2 варианта чтобы ротация работала. По умолчанию 3.',
      },
      fields: [
        {
          name: 'variant',
          type: 'select',
          required: true,
          options: [
            { label: 'Card with accent stripe', value: 'card-accent-left' },
            { label: 'Minimal modern', value: 'minimal-modern' },
            { label: 'Photo card', value: 'photo-card' },
            { label: 'Full-width dark', value: 'full-width-dark' },
          ],
        },
      ],
    },
    {
      name: 'intervalMs',
      label: 'Интервал переключения, ms (default 5000)',
      type: 'number',
      defaultValue: 5000,
    },
  ],
};
