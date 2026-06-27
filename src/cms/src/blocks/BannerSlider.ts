import type { Block } from 'payload';

/**
 * BannerSlider — image slider. A standalone section block; can be placed anywhere
 * on a page. One image = static, more than one = auto-rotating carousel.
 */
export const BannerSliderBlock: Block = {
  slug: 'banner-slider',
  labels: { singular: 'Banner slider', plural: 'Banner sliders' },
  fields: [
    {
      name: 'banners',
      label: 'Banners (images)',
      type: 'array',
      labels: { singular: 'Banner', plural: 'Banners' },
      minRows: 1,
      admin: {
        description: 'Paste image URLs. If more than one, rotates as a carousel (5s).',
      },
      fields: [
        {
          name: 'imageUrl',
          label: 'Image URL',
          type: 'text',
          required: true,
          admin: { description: 'Public URL (e.g. https://cdn.example.com/banners/1.png).' },
        },
        {
          name: 'alt',
          label: 'Alt text (for SEO and screen readers)',
          type: 'text',
        },
      ],
    },
  ],
};
