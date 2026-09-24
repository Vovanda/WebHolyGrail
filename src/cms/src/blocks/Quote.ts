import type { Block } from 'payload';

/**
 * Quote / Testimonial — a quote with an attribution.
 * Can be an "About us" block (with author photo) or a customer testimonial.
 */
export const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'Цитата или отзыв', plural: 'Цитаты и отзывы' },
  fields: [
    {
      name: 'heading',
      label: 'Section heading (optional)',
      type: 'text',
      defaultValue: 'About us',
    },
    { name: 'body', label: 'Quote text', type: 'textarea', required: true },
    { name: 'author', label: 'Author', type: 'text', required: true },
    { name: 'role', label: 'Role / title', type: 'text' },
    {
      name: 'photoUrls',
      label: 'Author photo (one or more → carousel)',
      type: 'array',
      labels: { singular: 'Фото', plural: 'Фото' },
      admin: {
        description:
          'Одно фото стоит неподвижно, несколько листаются сами каждые 5 секунд, со стрелками и перелистыванием пальцем.',
      },
      fields: [
        {
          name: 'file',
          label: 'Фото',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Файл из медиатеки: показ сам берёт вариант под размер места.' },
        },
        {
          /**
           * @deprecated Заменено полем `file`. Оставлено для страниц, собранных
           * до появления медиатеки в этом блоке: удаление поля стёрло бы фото
           * у тех, кто вписал сюда внешний адрес.
           */
          name: 'url',
          label: 'Адрес (устарело)',
          type: 'text',
          admin: {
            description:
              'Внешний адрес картинки. Для новых страниц заполняйте «Фото»: у адреса нет вариантов по размеру.',
          },
        },
      ],
    },
    {
      name: 'variant',
      label: 'Design variant',
      type: 'select',
      defaultValue: 'card-accent-left',
      options: [
        { label: 'Card with accent stripe (with photo)', value: 'card-accent-left' },
        { label: 'Minimal (no photo, no card)', value: 'minimal-modern' },
        { label: 'Photo card (customer testimonial)', value: 'photo-card' },
        { label: 'Full-width dark (marketing manifesto)', value: 'full-width-dark' },
      ],
    },
    {
      name: 'authorHref',
      label: 'Author link (optional)',
      type: 'text',
      admin: {
        description:
          'If set, author attribution becomes a link (e.g. GitHub profile, personal site).',
      },
    },
  ],
};
