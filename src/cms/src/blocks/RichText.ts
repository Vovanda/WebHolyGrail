import type { Block } from 'payload';

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
      name: 'content',
      label: 'Содержимое',
      type: 'richText',
      required: true,
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
