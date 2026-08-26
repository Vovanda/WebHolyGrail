import type { Block } from 'payload';

/**
 * VideoSet — набор роликов на произвольной странице.
 *
 * @remarks
 * Раньше набор умел быть только собственной страницей по короткому адресу,
 * поэтому вставить подборку в статью или на посадочную страницу было нельзя.
 * Этот блок и закрывает разрыв: редактор выбирает готовый набор, а список
 * роликов с замками собирается сам.
 *
 * Состав здесь не дублируется намеренно: набор живёт своей жизнью, ролики в
 * него добавляют и убирают, и вторая копия списка разошлась бы с ним на первой
 * же правке.
 *
 * Имя функциональное (R5++): подборка мастер-классов, серия репортажей со
 * стройки и цикл записей автора — один и тот же блок.
 */
export const VideoSetBlock: Block = {
  slug: 'videoSet',
  labels: { singular: 'Набор роликов', plural: 'Наборы роликов' },
  fields: [
    {
      name: 'playlist',
      label: 'Набор',
      type: 'relationship',
      relationTo: 'playlists',
      required: true,
      admin: {
        description: 'Готовый набор из раздела «Доступ к видео». Список роликов возьмётся из него.',
      },
    },
    {
      name: 'heading',
      label: 'Свой заголовок',
      type: 'text',
      admin: { description: 'Пусто — возьмётся название набора.' },
    },
    {
      name: 'subtitle',
      label: 'Своё описание',
      type: 'textarea',
      admin: { description: 'Пусто — возьмётся описание набора.' },
    },
    {
      /**
       * Плеер рядом со списком или только список.
       *
       * @remarks
       * По умолчанию плеер: набор для того и собирают, чтобы смотреть подряд,
       * не уходя со страницы. Только список нужен там, где плеер не к месту —
       * в статье или на посадочной странице.
       */
      name: 'mode',
      label: 'Что показывать',
      type: 'select',
      defaultValue: 'player',
      options: [
        { label: 'Плеер и список рядом', value: 'player' },
        { label: 'Только список, ролики открываются на своих страницах', value: 'list' },
      ],
    },
    {
      name: 'showCover',
      label: 'Показывать обложку набора',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showTitle',
      label: 'Показывать название набора',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showDescription',
      label: 'Показывать описание набора',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      /**
       * Как показать список.
       *
       * @remarks
       * Строками читается быстрее, когда роликов много и важен порядок;
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
        description: 'Пусто — весь набор. Остальные откроются на странице набора.',
      },
    },
    {
      name: 'showLink',
      label: 'Ссылка на весь набор',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Показывать под списком переход на страницу набора.' },
    },
  ],
};
