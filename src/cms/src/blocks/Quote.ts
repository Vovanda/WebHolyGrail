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
    {
      name: 'photoUrls',
      label: 'Фото автора (одно или несколько → карусель)',
      type: 'array',
      labels: { singular: 'Фото', plural: 'Фото' },
      admin: {
        description:
          'Если несколько — будут крутиться каруселью с автосменой 5 сек, со стрелками и свайпом.',
      },
      fields: [
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
          admin: { description: 'Например: https://cdn.veo55.ru/images/about/olga-1.jpg' },
        },
      ],
    },
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
