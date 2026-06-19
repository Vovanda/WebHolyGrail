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
      label: 'Заголовок (используй {accent} как место для янтарного слова)',
      type: 'text',
      required: true,
      defaultValue: 'Щенки {accent} с документами РКФ',
      admin: {
        description:
          'Пример: «Щенки {accent} с документами РКФ» — слово на месте `{accent}` будет показано янтарным italic. Если `{accent}` нет — весь заголовок будет одного цвета.',
      },
    },
    {
      name: 'titleAccent',
      label: 'Акцентное слово (заменит `{accent}` в заголовке)',
      type: 'text',
      defaultValue: 'ВЕО',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (для больших экранов)',
      type: 'text',
      defaultValue: 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
    },
    {
      name: 'subtitleShort',
      label: 'Подзаголовок (для маленьких экранов, опционально)',
      type: 'text',
      defaultValue: 'Питомник ВЕО «Омская Дружина» · г. Омск',
      admin: {
        description:
          'На mobile показывается этот вариант. Если пусто — используется обычный subtitle на всех экранах.',
      },
    },
    {
      name: 'bannerHeading',
      label: 'Текст на баннере (тёмная плашка)',
      type: 'text',
      defaultValue: 'Есть щенки',
    },
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
