import type { CollectionConfig } from 'payload';

/**
 * Articles — основная сущность блога (Posts в терминологии Ghost / Substack).
 *
 * @remarks
 * Имя `Articles` временно — после merge #49 (rename социал-Posts → SocialPosts)
 * этот файл переименовать в `Posts.ts` + slug `articles` → `posts`. См. #45.
 *
 * Каждый article опционально принадлежит **Thread** (серия связанных постов
 * одной темы), имеет M:N связь с **Tags**, опционально с одним **Author**.
 *
 * Visibility-toggles (`displayOverrides`) — per-article override глобальных
 * настроек в `SiteSettings.blog.show*`. null inherits.
 *
 * Hooks:
 *  - beforeChange: автогенерация `slug` из `title` если пуст
 *  - beforeChange: расчёт `readingTime` из `body` (Lexical AST → words ÷ 200)
 *  - beforeChange: set `publishedAt = now()` при первом переходе status → published
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Статья', plural: 'Статьи' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'thread', 'author'],
    group: 'Блог',
    description: 'Статьи блога. Status = draft/published, displayOverrides per-article.',
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'title',
      label: 'Заголовок',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок',
      type: 'text',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Часть URL: /blog/<slug>. Автогенерится из заголовка если пуст.',
      },
    },
    {
      name: 'lead',
      label: 'Лид (preview)',
      type: 'textarea',
      admin: {
        description: 'Короткое описание для карточек на /blog и в meta tags.',
      },
    },
    {
      name: 'cover',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      label: 'Текст',
      type: 'richText',
      required: true,
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Опубликовано', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
      index: true,
    },
    {
      name: 'publishedAt',
      label: 'Опубликовано',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Авто-set при первом status=published. Можно поменять руками.',
      },
      index: true,
    },
    {
      name: 'thread',
      label: 'Тред (серия)',
      type: 'relationship',
      relationTo: 'threads',
      admin: { description: 'Опционально — статья как часть серии.' },
    },
    {
      name: 'tags',
      label: 'Теги',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'author',
      label: 'Автор',
      type: 'relationship',
      relationTo: 'authors',
      admin: { description: 'Опционально. Single-author блог может не использовать.' },
    },
    {
      name: 'readingTime',
      label: 'Время чтения (мин)',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Авто-расчёт по body (слова / 200).',
      },
    },
    {
      name: 'displayOverrides',
      label: 'Override отображения',
      type: 'group',
      admin: {
        description:
          'Per-article override глобальных SiteSettings.blog.show*. Пусто = inherit global.',
      },
      fields: [
        { name: 'showAuthor', type: 'checkbox' },
        { name: 'showDate', type: 'checkbox' },
        { name: 'showReadingTime', type: 'checkbox' },
        { name: 'showTags', type: 'checkbox' },
      ],
    },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Auto-slug если пуст
        if (!data.slug && typeof data.title === 'string') {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^\w\sЀ-ӿ-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 80);
        }
        // Auto-publishedAt при первом переходе draft → published
        if (
          data.status === 'published' &&
          !data.publishedAt &&
          (originalDoc?.status !== 'published' || !originalDoc?.publishedAt)
        ) {
          data.publishedAt = new Date().toISOString();
        }
        // Auto-readingTime из body (Lexical AST)
        if (data.body) {
          const text = extractTextFromLexical(data.body);
          const words = text.split(/\s+/).filter(Boolean).length;
          data.readingTime = Math.max(1, Math.round(words / 200));
        }
        return data;
      },
    ],
  },
  access: {
    read: ({ req: { user } }) => {
      // Public видит только published, авторизованные — всё (черновики).
      if (user) return true;
      return { status: { equals: 'published' } };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
};

interface LexNode {
  text?: string;
  children?: ReadonlyArray<LexNode>;
}

function extractTextFromLexical(content: unknown): string {
  const root = (content as { root?: LexNode } | null | undefined)?.root;
  if (!root) return '';
  const parts: string[] = [];
  const walk = (node: LexNode): void => {
    if (typeof node.text === 'string') parts.push(node.text);
    if (node.children) node.children.forEach(walk);
  };
  walk(root);
  return parts.join(' ');
}
