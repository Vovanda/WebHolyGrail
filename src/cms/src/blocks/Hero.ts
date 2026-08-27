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
  ],
};
