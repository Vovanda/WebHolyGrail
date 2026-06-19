import type { Block } from 'payload';

/**
 * Quote / Testimonial — цитата с подписью.
 * Может быть «О нас» (с фото автора) или отзыв клиента.
 */
export const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Цитата / Отзыв', plural: 'Цитаты' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции (опционально)',
      type: 'text',
      defaultValue: 'О нас',
    },
    { name: 'body', label: 'Текст цитаты', type: 'textarea', required: true },
    { name: 'author', label: 'Автор', type: 'text', required: true },
    { name: 'role', label: 'Должность / роль', type: 'text' },
    { name: 'photo', label: 'Фото автора', type: 'upload', relationTo: 'media' },
    {
      name: 'variant',
      label: 'Вариант дизайна',
      type: 'select',
      defaultValue: 'card-accent-left',
      options: [
        { label: 'Карточка с янтарной полосой (veo55-стиль, с фото)', value: 'card-accent-left' },
        { label: 'Минимал (без фото, без карточки)', value: 'minimal-modern' },
        { label: 'Фото-карточка (отзыв клиента)', value: 'photo-card' },
      ],
    },
  ],
};
