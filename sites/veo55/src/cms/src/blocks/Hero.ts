import type { Block } from 'payload';

/**
 * Hero — главный экран страницы.
 * Tip для админа: использовать в самом верху страницы как «обложку».
 */
export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Главный экран (Hero)', plural: 'Главные экраны' },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true },
    { name: 'subtitle', label: 'Подзаголовок', type: 'text' },
    {
      name: 'banners',
      label: 'Баннеры (фото на тёмной плашке сверху)',
      type: 'array',
      labels: { singular: 'Баннер', plural: 'Баннеры' },
      admin: {
        description: 'Если несколько — будут крутиться каруселью. Если пусто — покажется заглушка.',
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'Картинка' },
        { name: 'altOverride', type: 'text', label: 'Подпись (если отличается от alt медиа)' },
      ],
    },
  ],
};
