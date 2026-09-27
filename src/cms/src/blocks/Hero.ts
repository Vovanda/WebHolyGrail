import type { Block } from 'payload';

/**
 * Hero — главный экран страницы.
 * Tip для админа: использовать в самом верху страницы как «обложку».
 */
export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Главный экран (Hero)', plural: 'Главные экраны' },
  fields: [
    {
      name: 'title',
      label: 'Заголовок',
      type: 'text',
      required: true,
    },
    {
      name: 'titleAccent',
      label: 'Что выделить в заголовке',
      type: 'text',
      admin: {
        description:
          'Часть заголовка, которая станет акцентной. Регистр не важен. Несколько частей — через вертикальную черту: «видео|сайте». Пусто — заголовок одного цвета.',
        placeholder: 'Видео',
      },
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (для больших экранов)',
      type: 'text',
    },
    {
      name: 'subtitleShort',
      label: 'Подзаголовок (для маленьких экранов, опционально)',
      type: 'text',
      admin: {
        description:
          'На mobile показывается этот вариант. Если пусто — используется обычный subtitle на всех экранах.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'photo',
          label: 'Фото под текстом',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Ложится под заголовок во всю ширину блока. Пусто — без фото.' },
        },
        {
          name: 'veil',
          label: 'Вуаль над фото, %',
          type: 'number',
          min: 0,
          max: 95,
          admin: {
            description:
              'Слой цвета фона темы поверх фото: больше - текст читается легче. Пусто - 60.',
          },
        },
      ],
    },
  ],
};
