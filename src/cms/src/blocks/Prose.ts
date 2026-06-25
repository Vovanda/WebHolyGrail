import type { Block } from 'payload';

/**
 * Prose / RichText — содержательный текстовый блок (О нас, био, FAQ-ответ, статья).
 *
 * @remarks
 * Сейчас простое поле textarea (абзацы через двойной перенос). Когда понадобится
 * форматирование (жирный/курсив/списки/ссылки) — заменим на richText (Lexical).
 */
export const ProseBlock: Block = {
  slug: 'prose',
  labels: { singular: 'Текст (абзацы)', plural: 'Текстовые блоки' },
  fields: [
    {
      name: 'body',
      label: 'Текст',
      type: 'textarea',
      required: true,
      admin: { description: 'Абзацы разделяются двойным переносом строки.' },
    },
    {
      name: 'variant',
      label: 'Вариант дизайна',
      type: 'select',
      defaultValue: 'editorial-with-dropcap',
      options: [
        { label: 'Редакционный с буквицей (veo55-стиль)', value: 'editorial-with-dropcap' },
        { label: 'Редакционный без буквицы', value: 'editorial-plain' },
        { label: 'Современный sans-serif', value: 'modern-sans' },
      ],
    },
  ],
};
