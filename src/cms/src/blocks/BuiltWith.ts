import type { Block } from 'payload';

/**
 * BuiltWith — секция «реальные сайты на этом стеке».
 *
 * Tip для админа: показывает живые production-инстансы для credibility.
 * Каждая карточка — имя сайта + URL + ниша + опциональный preview-скриншот.
 * Заменяет fake testimonials/logo-cloud когда есть реальные проекты.
 *
 * Generic — любой downstream может использовать как «наши проекты» или
 * «партнёры». Для WHG-template — реальные сайты Володи на стеке.
 */
export const BuiltWithBlock: Block = {
  slug: 'built-with',
  labels: { singular: 'Реальные сайты на стеке', plural: 'Списки сайтов' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции',
      type: 'text',
      defaultValue: 'Сайты, которые уже работают',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (опционально)',
      type: 'text',
      defaultValue: 'Реальные production-инстансы на этом стеке.',
    },
    {
      name: 'items',
      label: 'Сайты',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      admin: {
        description: 'Каждая карточка — site + url. Если есть screenshot — показывается превью.',
      },
      fields: [
        { name: 'siteName', label: 'Имя сайта', type: 'text', required: true },
        { name: 'url', label: 'URL (https://...)', type: 'text', required: true },
        { name: 'niche', label: 'Ниша (1-2 слова)', type: 'text' },
        {
          name: 'screenshot',
          label: 'Скриншот превью (опционально)',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
  ],
};
