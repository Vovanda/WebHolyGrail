import type { Block } from 'payload';

/**
 * Video — плеер на произвольной странице.
 *
 * @remarks
 * Редактор выбирает медиафайл, остальное блок берёт сам: адрес плейлиста,
 * качества и режим доступа приходят из карточки видео. Дублировать их здесь
 * значило бы разъехаться с ней при первой же перенарезке.
 *
 * Имя функциональное (R5++): репортаж со стройки и видео мастер-класса — один и тот же
 * блок.
 */
export const VideoBlock: Block = {
  slug: 'video',
  labels: { singular: 'Видео', plural: 'Видео' },
  fields: [
    {
      name: 'video',
      label: 'Видео',
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
      name: 'showTitle',
      label: 'Показывать название',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Название берётся у самой записи и стоит под кадром.' },
    },
    {
      name: 'showDescription',
      label: 'Показывать описание',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Описание записи под названием. Задаётся в карточке видео.' },
    },
    {
      /**
       * Прежняя подпись, набранная в блоке.
       *
       * @deprecated Название - свойство записи: набранное здесь расходится
       * с ней на соседней странице. Поле оставлено заполненным сайтам (R10)
       * и перекрывает название записи, пока в нём есть текст.
       */
      name: 'title',
      label: 'Подпись (устарело)',
      type: 'text',
      admin: {
        description:
          'Название теперь берётся у самой записи. Заполненное здесь пока показывается вместо него - перенесите текст в карточку видео и очистите поле.',
      },
    },
    {
      /** @deprecated То же, что и `title`: описание живёт у записи. */
      name: 'description',
      label: 'Описание (устарело)',
      type: 'textarea',
      admin: {
        description: 'Описание теперь берётся у самой записи. Заполненное здесь пока показывается.',
      },
    },
    {
      name: 'poster',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Картинка до нажатия «play». Можно не задавать: кадр из видео снимается сам при нарезке. Своя обложка его заменяет.',
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
