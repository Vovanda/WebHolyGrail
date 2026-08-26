import type { Block } from 'payload';

/**
 * Video — плеер на произвольной странице.
 *
 * @remarks
 * Редактор выбирает медиафайл, остальное блок берёт сам: адрес плейлиста,
 * качества и режим доступа приходят из карточки видео. Дублировать их здесь
 * значило бы разъехаться с ней при первой же перенарезке.
 *
 * Имя функциональное (R5++): репортаж со стройки и запись мастер-класса — один и тот же
 * блок.
 */
export const VideoBlock: Block = {
  slug: 'video',
  labels: { singular: 'Видео', plural: 'Видео' },
  fields: [
    {
      name: 'video',
      label: 'Ролик',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: () => ({ mimeType: { like: 'video' } }),
      admin: {
        description:
          'Загруженное видео из раздела «Медиа». Нарезка и качества готовятся сами после загрузки.',
      },
    },
    {
      name: 'title',
      label: 'Подпись',
      type: 'text',
      admin: { description: 'Показывается над плеером. Можно оставить пустым.' },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
    },
    {
      name: 'poster',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Картинка до нажатия «play». Можно не задавать: кадр из ролика снимается сам при нарезке. Своя обложка его заменяет.',
      },
    },
    {
      name: 'width',
      label: 'Ширина',
      type: 'select',
      defaultValue: 'content',
      options: [
        { label: 'В колонку текста', value: 'content' },
        { label: 'Во всю ширину секции', value: 'wide' },
      ],
    },
  ],
};
