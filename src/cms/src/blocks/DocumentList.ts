import type { Block } from 'payload';

/**
 * Документы для скачивания: карта предприятия, лицензии, допуски, прайс.
 *
 * @remarks
 * Добавление документа — одно действие: выбрать файл. Название подставится из
 * имени файла, превью для PDF соберётся само из первой страницы (см. хук в
 * коллекции `Media`). Заполнять описание и готовить картинку заранее не нужно —
 * иначе половина документов так и не появится на сайте.
 *
 * Для B2B-сайта это не декоративная секция: реквизиты и допуски — первое, что
 * ищет снабженец перед тем, как отправить запрос.
 */
export const DocumentListBlock: Block = {
  slug: 'document-list',
  labels: { singular: 'Документы', plural: 'Блоки документов' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок',
      type: 'text',
      defaultValue: 'Документы',
    },
    {
      name: 'description',
      label: 'Пояснение',
      type: 'textarea',
      admin: { description: 'Не обязательно. Например: «Реквизиты и разрешительные документы».' },
    },
    {
      name: 'items',
      label: 'Документы',
      type: 'array',
      labels: { singular: 'Документ', plural: 'Документы' },
      minRows: 1,
      admin: {
        description: 'Достаточно выбрать файл — остальное подставится само.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'file',
          label: 'Файл',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          label: 'Название',
          type: 'text',
          admin: { description: 'Пусто — возьмётся имя файла.' },
        },
        {
          name: 'note',
          label: 'Примечание',
          type: 'text',
          admin: { description: 'Например: «действует до 2027 года».' },
        },
      ],
    },
    {
      name: 'layout',
      label: 'Вид',
      type: 'select',
      defaultValue: 'cards',
      options: [
        { label: 'Плитки с превью', value: 'cards' },
        { label: 'Список строкой', value: 'list' },
      ],
      admin: {
        description:
          'Плитки — когда документов немного и превью что-то показывает. Список — когда их десяток и важнее названия.',
      },
    },
  ],
};
