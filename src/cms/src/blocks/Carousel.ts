import type { Block } from 'payload';

/**
 * Карусель - лента, которая листается.
 *
 * @remarks
 * Ставится на любую страницу и наполняется двумя способами: карточками руками
 * либо живой коллекцией сайта, когда лента должна обновляться сама.
 */
export const CarouselBlock: Block = {
  slug: 'carousel',
  labels: { singular: 'Карусель', plural: 'Карусели' },
  fields: [
    { name: 'heading', label: 'Заголовок', type: 'text' },
    { name: 'subtitle', label: 'Пояснение под заголовком', type: 'text' },
    {
      name: 'mode',
      label: 'Как показывать',
      type: 'select',
      defaultValue: 'row',
      options: [
        { label: 'Лентой карточек', value: 'row' },
        { label: 'Кадром во всю ширину', value: 'single' },
      ],
      admin: { description: 'Лента показывает несколько карточек, кадр - по одному.' },
    },
    {
      name: 'sourceKind',
      label: 'Откуда брать',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Карточки заведены здесь', value: 'manual' },
        { label: 'Записи блога', value: 'articles' },
        { label: 'Видео канала', value: 'videos' },
      ],
      admin: { description: 'Живая коллекция обновляет ленту сама.' },
    },
    {
      name: 'sourceChannel',
      label: 'Канал',
      type: 'text',
      admin: {
        condition: (_, siblings) => siblings?.sourceKind === 'videos',
        description: 'Имя канала без собачки, например whg.',
      },
    },
    {
      name: 'sourceLimit',
      label: 'Сколько показать',
      type: 'number',
      defaultValue: 8,
      min: 1,
      max: 40,
      admin: { condition: (_, siblings) => siblings?.sourceKind !== 'manual' },
    },
    {
      name: 'sourceOrder',
      label: 'Порядок',
      type: 'select',
      defaultValue: 'newest',
      options: [
        { label: 'Сначала свежие', value: 'newest' },
        { label: 'Сначала старые', value: 'oldest' },
      ],
      admin: { condition: (_, siblings) => siblings?.sourceKind !== 'manual' },
    },
    {
      name: 'cards',
      label: 'Карточки',
      type: 'array',
      minRows: 1,
      maxRows: 24,
      admin: { condition: (_, siblings) => siblings?.sourceKind === 'manual' },
      fields: [
        { name: 'image', label: 'Картинка', type: 'upload', relationTo: 'media' },
        { name: 'title', label: 'Подпись', type: 'text' },
        { name: 'text', label: 'Пояснение', type: 'textarea' },
        { name: 'href', label: 'Куда ведёт', type: 'text' },
        { name: 'linkLabel', label: 'Текст ссылки', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Как листается',
      admin: { initCollapsed: true },
      fields: [
        { name: 'arrows', label: 'Стрелки по краям', type: 'checkbox', defaultValue: true },
        { name: 'dots', label: 'Точки под лентой', type: 'checkbox', defaultValue: false },
        { name: 'loop', label: 'По кругу', type: 'checkbox', defaultValue: false },
        {
          name: 'autoplaySeconds',
          label: 'Пауза между кадрами, секунды',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 30,
          admin: { description: 'Ноль - листать только руками.' },
        },
        {
          name: 'cardWidth',
          label: 'Ширина карточки',
          type: 'text',
          admin: { description: 'Например 16rem или 70%. Пусто - по содержимому.' },
        },
        {
          name: 'aspect',
          label: 'Пропорции кадра',
          type: 'text',
          admin: { description: 'Например 16 / 9. Пусто - по содержимому.' },
        },
      ],
    },
  ],
};
