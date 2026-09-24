import type { Block } from 'payload';

/**
 * BannerSlider — image slider. A standalone section block; can be placed anywhere
 * on a page. One image = static, more than one = auto-rotating carousel.
 */
export const BannerSliderBlock: Block = {
  slug: 'banner-slider',
  labels: { singular: 'Баннеры в слайдере', plural: 'Баннеры в слайдере' },
  fields: [
    {
      name: 'banners',
      label: 'Banners (images)',
      type: 'array',
      labels: { singular: 'Слайд', plural: 'Слайды' },
      minRows: 1,
      admin: {
        description: 'Один баннер стоит неподвижно, несколько листаются сами каждые 5 секунд.',
      },
      fields: [
        {
          name: 'image',
          label: 'Изображение',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Файл из медиатеки: показ сам берёт вариант под размер места.' },
        },
        {
          /**
           * @deprecated Заменено полем `image`. Оставлено для страниц, собранных
           * до появления медиатеки в этом блоке: удаление поля стёрло бы баннер
           * у тех, кто вписал сюда внешний адрес.
           */
          name: 'imageUrl',
          label: 'Адрес (устарело)',
          type: 'text',
          admin: {
            description:
              'Внешний адрес картинки. Для новых баннеров заполняйте «Изображение»: у адреса нет вариантов по размеру.',
          },
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
