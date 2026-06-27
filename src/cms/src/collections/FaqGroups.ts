import type { CollectionConfig } from 'payload';

/**
 * FAQ-группы — раздел сайта «Ответы на вопросы».
 *
 * @remarks
 * **R5++ generic.** Подходит любому сайту: «Услуги / Цены / Запись» (автосервис),
 * «Приём / Анализы / Оплата» (клиника), «Доставка / Возврат / Размеры» (магазин).
 *
 * **Структура:** одна группа = заголовок + emoji + порядок + массив вопросов.
 * Каждый вопрос — `question` (text) + `answer` (RichText Lexical) +
 * `openByDefault` (открыт ли при загрузке).
 *
 * **Render:** блок `faq-accordion` на странице берёт все опубликованные
 * группы и рендерит по `order` (или фильтр через `groups` relation в блоке).
 *
 * **Drafts + versions** включены — content manager может править ответ → preview →
 * publish без раскатки на лайв до проверки.
 */
export const FaqGroups: CollectionConfig = {
  slug: 'faq-groups',
  labels: { singular: 'FAQ-группа', plural: 'FAQ-группы' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['order', 'title', 'emoji', 'updatedAt', '_status'],
    group: 'Контент',
    description:
      'Группы вопросов на странице «Ответы на вопросы». Порядок — поле order (меньше = выше). Drag-and-drop вопросов внутри группы — стрелками или копированием.',
    // hidden: true — коллекция скрыта в админке. FAQ переезжает на inline-items
    // в FaqAccordion-блоке + отдельная /faq страница (см. issue #39).
    // Удалим коллекцию полностью когда #39 будет готов (нужна миграция DROP TABLE).
    hidden: true,
  },
  defaultSort: 'order',
  versions: { drafts: true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'order',
          label: 'Порядок',
          type: 'number',
          required: true,
          defaultValue: 100,
          admin: {
            width: '20%',
            description: 'Меньше — выше. 10/20/30… оставляйте gap для вставок.',
          },
        },
        {
          name: 'emoji',
          label: 'Emoji',
          type: 'text',
          defaultValue: '🏡',
          admin: { width: '20%', description: 'Один emoji слева от заголовка секции.' },
        },
        {
          name: 'title',
          label: 'Название группы',
          type: 'text',
          required: true,
          admin: {
            width: '60%',
            description: 'Например: «О business, «Документы и здоровье».',
          },
        },
      ],
    },
    {
      name: 'slug',
      label: 'Slug (для anchor-ссылок)',
      type: 'text',
      admin: {
        description:
          'Опционально. Используется как `#<slug>` для chips-нумерации. Если пусто — генерируется из title.',
      },
    },
    {
      name: 'items',
      label: 'Вопросы',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Вопрос', plural: 'Вопросы' },
      admin: {
        description: 'Порядок задаётся вручную (drag&drop / стрелки в админке).',
      },
      fields: [
        {
          name: 'question',
          label: 'Вопрос',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          label: 'Ответ',
          type: 'richText',
          required: true,
          admin: {
            description: 'Форматирование: жирный, курсив, списки, ссылки. Можно несколько абзацев.',
          },
        },
        {
          name: 'openByDefault',
          label: 'Раскрыт по умолчанию',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Первый вопрос группы обычно отмечают — пользователь сразу видит формат.',
          },
        },
      ],
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return { _status: { equals: 'published' } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
