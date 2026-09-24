'use client';

import {
  createClientFeature,
  slashMenuBasicGroupWithItems,
  toolbarAddDropdownGroupWithItems,
} from '@payloadcms/richtext-lexical/client';
import type { LexicalEditor } from '@payloadcms/richtext-lexical/lexical';

import { AttachmentPlugin } from './attachment.plugin';
import { OPEN_ATTACHMENT_COMMAND } from './insert-commands';
import { UploadGlyph } from './upload-glyph';

/** По подписи видно, что пунктом ставится любой файл медиатеки. */
const LABEL = 'Фото/Видео/Документ';

const open = ({ editor }: { editor: LexicalEditor }) => {
  editor.dispatchCommand(OPEN_ATTACHMENT_COMMAND, undefined);
};

/**
 * Пункт первым в «+» и в слэш-меню, окно медиатеки у каждого редактора.
 *
 * @remarks
 * Номер 1 ставит пункт первым: пункты с номером идут раньше штатных без
 * номера. Штатное «Загрузить» в «+» скрыто стилями админки; в слэш-меню оно
 * остаётся - там его не спрятать, меню ходит по пунктам стрелками и выбрало
 * бы невидимый.
 */
export const AttachmentClientFeature = createClientFeature({
  plugins: [{ Component: AttachmentPlugin, position: 'normal' }],
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: UploadGlyph,
          key: 'insert-attachment',
          keywords: [
            'фото',
            'видео',
            'документ',
            'файл',
            'картинка',
            'вложение',
            'attachment',
            'file',
          ],
          label: LABEL,
          onSelect: open,
        },
      ]),
    ],
  },
  toolbarFixed: {
    groups: [
      toolbarAddDropdownGroupWithItems([
        {
          ChildComponent: UploadGlyph,
          key: 'insert-attachment',
          label: LABEL,
          order: 1,
          onSelect: open,
        },
      ]),
    ],
  },
});
