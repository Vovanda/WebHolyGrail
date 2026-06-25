import type { Block } from 'payload';

/**
 * BannerSlider — автослайдер с фотографиями. Самостоятельный блок-секция,
 * можно добавить в любом месте страницы. При 1 фото — статичная, при >1 — карусель.
 */
export const BannerSliderBlock: Block = {
  slug: 'banner-slider',
  labels: { singular: 'Слайдер баннеров', plural: 'Слайдеры баннеров' },
  fields: [
    {
      name: 'banners',
      label: 'Баннеры (фото)',
      type: 'array',
      labels: { singular: 'Баннер', plural: 'Баннеры' },
      minRows: 1,
      admin: {
        description: 'Вставь URL фото с CDN. При нескольких — автоматическая карусель (5 сек).',
      },
      fields: [
        {
          name: 'imageUrl',
          label: 'URL картинки',
          type: 'text',
          required: true,
          admin: { description: 'Например: https://cdn.veo55.ru/headers/banner1.png' },
        },
        {
          name: 'alt',
          label: 'Alt-текст (для SEO и скринридеров)',
          type: 'text',
        },
      ],
    },
  ],
};
