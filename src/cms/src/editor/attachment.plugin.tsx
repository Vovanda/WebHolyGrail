'use client';

import { INSERT_BLOCK_COMMAND } from '@payloadcms/richtext-lexical/client';
import { COMMAND_PRIORITY_EDITOR } from '@payloadcms/richtext-lexical/lexical';
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext';
import { useListDrawer } from '@payloadcms/ui';
import { useEffect } from 'react';

import { ATTACHMENT_COLLECTION, attachmentBlock } from './attachment-block';
import { OPEN_ATTACHMENT_COMMAND } from './insert-commands';

/**
 * «Вложение»: окно медиатеки и блок по типу выбранного файла.
 *
 * @remarks
 * Окно - штатное окно выбора Payload, с поиском, папками и заливкой нового
 * файла. Выбранный файл уходит в текст готовым блоком: что ставить, решает
 * `attachmentBlock`, вставляет редактор своей командой.
 */
export function AttachmentPlugin() {
  const [editor] = useLexicalComposerContext();
  const [ListDrawer, , { closeDrawer, openDrawer }] = useListDrawer({
    collectionSlugs: [ATTACHMENT_COLLECTION],
    uploads: true,
  });

  useEffect(
    () =>
      editor.registerCommand(
        OPEN_ATTACHMENT_COMMAND,
        () => {
          openDrawer();
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    [editor, openDrawer],
  );

  return (
    <ListDrawer
      onSelect={({ doc }) => {
        closeDrawer();
        editor.dispatchCommand(
          INSERT_BLOCK_COMMAND,
          attachmentBlock({ id: doc.id, mimeType: doc.mimeType }),
        );
      }}
    />
  );
}
