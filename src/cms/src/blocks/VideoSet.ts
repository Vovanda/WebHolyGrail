import type { Block } from 'payload';

/**
 * VideoSet — плейлист видео на произвольной странице.
 *
 * @remarks
 * Раньше плейлист умел быть только собственной страницей по короткому адресу,
 * поэтому вставить подборку в статью или на посадочную страницу было нельзя.
 * Этот блок и закрывает разрыв: редактор выбирает готовый плейлист, а список
 * видео с замками собирается сам.
 *
 * Состав здесь не дублируется намеренно: плейлист живёт своей жизнью, видео в
 * него добавляют и убирают, и вторая копия списка разошлась бы с ним на первой
 * же правке.
 *
 * Имя функциональное (R5++): подборка мастер-классов, серия репортажей со
 * стройки и цикл записей автора — один и тот же блок.
 */
export const VideoSetBlock: Block = {
  slug: 'videoSet',
  labels: { singular: 'Плейлист видео', plural: 'Плейлисты видео' },
  fields: [
    {
      name: 'playlist',
      label: 'Плейлист',
      type: 'relationship',
      relationTo: 'playlists',
      required: true,
      admin: {
        description:
          'Готовый плейлист из раздела «Доступ к видео». Список видео возьмётся из него.',
      },
    },
    {
      name: 'heading',
      label: 'Свой заголовок',
      type: 'text',
      admin: { description: 'Пусто — возьмётся название плейлиста.' },
    },
    {
      name: 'subtitle',
      label: 'Своё описание',
      type: 'textarea',
      admin: { description: 'Пусто — возьмётся описание плейлиста.' },
    },
    {
      /**
       * Плеер рядом со списком или только список.
       *
       * @remarks
       * По умолчанию плеер: плейлист для того и собирают, чтобы смотреть подряд,
       * не уходя со страницы. Только список нужен там, где плеер не к месту —
       * в статье или на посадочной странице.
       */
      name: 'mode',
      label: 'Что показывать',
      type: 'select',
      defaultValue: 'player',
      options: [
        { label: 'Плеер и список рядом', value: 'player' },
        { label: 'Только список, видео открываются на своих страницах', value: 'list' },
      ],
    },
    {
      name: 'showCover',
      label: 'Показывать обложку плейлиста',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showTitle',
      label: 'Показывать название плейлиста',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showDescription',
      label: 'Показывать описание плейлиста',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      /**
       * Как показать список.
       *
       * @remarks
       * Строками читается быстрее, когда видео много и важен порядок;
       * плитками — когда важнее обложки, например на посадочной странице.
       */
      name: 'layout',
      label: 'Вид списка',
      admin: { condition: (_data, sibling) => sibling?.['mode'] === 'list' },
      type: 'select',
      defaultValue: 'rows',
      options: [
        { label: 'Строками, по порядку', value: 'rows' },
        { label: 'Плитками', value: 'grid' },
      ],
    },
    {
      name: 'limit',
      label: 'Сколько показать',
      type: 'number',
      min: 1,
      admin: {
        description: 'Пусто — весь плейлист. Остальные откроются на странице плейлиста.',
      },
    },
    {
      name: 'showLink',
      label: 'Ссылка на весь плейлист',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Показывать под списком переход на страницу плейлиста.' },
    },
  ],
};
