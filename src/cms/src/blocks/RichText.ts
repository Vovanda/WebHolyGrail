import type { Block } from 'payload';
import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical';

import { CollapsibleBlock } from './Collapsible';
import { VideoBlock } from './Video';
import { VideoSetBlock } from './VideoSet';

/**
 * RichText — форматированный текст страницы (R5++).
 *
 * @remarks
 * В отличие от `Prose` (plain textarea, абзацы через пустую строку) здесь
 * полноценный Lexical: заголовки, списки, цитаты, ссылки и картинки по ходу
 * текста. Это дефолтный блок для страниц вроде «О проекте», «CV», «Услуги» —
 * то есть всего, что раньше писали бы в редакторе блога.
 *
 * Рендерится `LexicalRenderer` (primitives/RichText).
 */
export const RichTextBlock: Block = {
  slug: 'rich-text',
  labels: { singular: 'Текст', plural: 'Текстовые блоки' },
  fields: [
    {
      /**
       * Содержимое текстового блока.
       *
       * @remarks
       * Видео вставляется прямо в текст - тем же набором, что и в статье.
       * Без этого редактор не знает узел с видео: содержимое, где оно уже
       * стоит, открыть нельзя вовсе, и правка текста страницы встаёт.
       *
       * Список блоков намеренно короткий: полный набор страничных блоков
       * внутри текста превращает блок во вторую страницу.
       */
      name: 'content',
      label: 'Содержимое',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [VideoBlock, VideoSetBlock, CollapsibleBlock] }),
          // Панель на виду: с телефона вставить нечем, наведения мышью там нет.
          FixedToolbarFeature(),
        ],
      }),
    },
    {
      name: 'width',
      label: 'Ширина',
      type: 'select',
      defaultValue: 'content',
      options: [
        { label: 'Как у статьи (узкая колонка)', value: 'content' },
        { label: 'Широкая', value: 'wide' },
      ],
    },
  ],
};
