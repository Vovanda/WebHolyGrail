import type { Block } from 'payload';

/**
 * FeatureGrid — сетка карточек "что внутри" с иконкой/заголовком/описанием.
 *
 * Tip для админа: 3-7 карточек оптимально. На desktop ряд, на mobile wrap 2 в строке.
 * Используется как «что уже решено за вас» в дев-tool или «наши услуги» в business-сайтах.
 */
export const FeatureGridBlock: Block = {
  slug: 'feature-grid',
  labels: { singular: 'Сетка фич', plural: 'Сетки фич' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции',
      type: 'text',
      defaultValue: 'Что уже решено за вас',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (опционально)',
      type: 'text',
    },
    {
      name: 'layout',
      label: 'Раскладка',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Сетка — видно все карточки сразу', value: 'grid' },
        { label: 'Карусель — листается, для длинных списков и превью', value: 'carousel' },
      ],
      admin: {
        description:
          'Сетка — когда карточек 3–7 и важно показать набор целиком. Карусель — когда их много или каждая держит крупное превью.',
      },
    },
    {
      name: 'items',
      label: 'Карточки фич',
      type: 'array',
      minRows: 2,
      maxRows: 12,
      fields: [
        { name: 'icon', label: 'Иконка (emoji или lucide-имя)', type: 'text', required: true },
        { name: 'title', label: 'Заголовок карточки', type: 'text', required: true },
        { name: 'subtitle', label: 'Подзаголовок (1 строка)', type: 'text' },
        { name: 'description', label: 'Описание (1 строка)', type: 'text' },
        {
          name: 'details',
          label: 'Детальное описание (открывается в модалке по клику)',
          type: 'textarea',
          admin: {
            description:
              'Несколько фраз почему это решение хорошо. Если пусто — карточка не кликабельна.',
          },
        },
        {
          name: 'images',
          label: 'Картинки карточки',
          type: 'array',
          maxRows: 8,
          admin: {
            description:
              'Одна картинка — показывается статично над текстом, несколько — слайдер со стрелками и свайпом. Пусто — рисуется иконка.',
          },
          fields: [
            {
              name: 'image',
              label: 'Изображение',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          name: 'href',
          label: 'Ссылка карточки',
          type: 'text',
          admin: {
            description:
              'Куда ведёт карточка: /audit, https://example.com. Пусто — карточка никуда не ведёт. ' +
              'Если заполнено вместе с детальным описанием — по клику открывается модалка, а ссылка ' +
              'показывается в ней кнопкой.',
          },
        },
      ],
    },
  ],
};
