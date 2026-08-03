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
      label: 'Заголовок (используй {accent} как место для акцентного слова)',
      type: 'text',
      required: true,
      admin: {
        description:
          'Слово на месте `{accent}` будет показано акцентным italic. Если `{accent}` нет — весь заголовок одного цвета.',
      },
    },
    {
      name: 'titleAccent',
      label: 'Акцентное слово (заменит `{accent}` в заголовке)',
      type: 'text',
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
