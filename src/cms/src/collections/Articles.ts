import type { CollectionConfig } from 'payload';
import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';

import { CaretReadyFeature } from '../editor/caret-ready';
import { CollapsibleBlock } from '../blocks/Collapsible';
import { VideoBlock } from '../blocks/Video';
import { VideoSetBlock } from '../blocks/VideoSet';

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
      /*
        Автосохранение раз в пятнадцать секунд, а не раз в две.

        Статья весит десятки килобайт, и каждое сохранение уходит целиком.
        На двух секундах с телефона запросы идут сплошным потоком и на мобильной
        связи рвутся - владелец видит обрыв соединения и не понимает, сохранилось
        ли написанное. Пятнадцать секунд достаточно, чтобы не потерять работу
        при закрытой вкладке, и редки настолько, чтобы проходить по слабому каналу.
      */
      autosave: { interval: 15000 },
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
      /**
       * Текст статьи с блоками внутри.
       *
       * @remarks
       * Видео и плейлист вставляются прямо в текст: разбор на видео посреди статьи
       * — обычное дело, а отправлять читателя на другую страницу за ним значит
       * терять его на полпути.
       *
       * Список блоков намеренно короткий. Полный плейлист страничных блоков внутри
       * текста превращает статью во вторую страницу, у которой своя вёрстка
       * спорит с типографикой вокруг.
       */
      name: 'body',
      label: 'Текст',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [VideoBlock, VideoSetBlock, CollapsibleBlock] }),
          /*
            Закреплённая панель нужна не для красоты: без неё вставка живёт только
            в плавающей панели выделения и в слэш-меню, а кнопка «добавить» на строке
            появляется по наведению мышью. На телефоне наведения нет - и владелец видит
            форматирование текста, но не может вставить ни запись, ни картинку. Статью
            с телефона так не написать.
          */
          FixedToolbarFeature(),
          /*
            Место вставки готово сразу: без него первая же кнопка панели молчит,
            потому что вставлять некуда - в тексте ещё не нажимали.
          */
          CaretReadyFeature(),
        ],
      }),
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
