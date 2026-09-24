import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Поле статьи показывает колонку сайта: лист её ширины, по бокам серое.
 *
 * @remarks
 * Текст переносится так же, как на сайте, и вставленное не выходит за колонку.
 * Работа в браузере - в `editor-sheet.client.tsx`.
 */
export const EditorSheetFeature = createServerFeature({
  feature: {
    ClientFeature: '/editor/editor-sheet.client#EditorSheetClientFeature',
  },
  key: 'editorSheet',
});
