import { createCommand, type LexicalCommand } from '@payloadcms/richtext-lexical/lexical';

/*
  Команды пунктов «+», которые открывают окно, а не вставляют сразу.

  Командой, а не событием страницы: у статьи несколько полей с редактором,
  и пункт меню одного из них не должен открывать окно у соседа.
*/

/** Открыть окно «Другие компоненты» в этом редакторе; строка - готовый запрос поиска. */
export const OPEN_BLOCK_PICKER_COMMAND: LexicalCommand<string | undefined> =
  createCommand('WHG_OPEN_BLOCK_PICKER');

/** Открыть медиатеку, чтобы приложить файл к тексту этого редактора. */
export const OPEN_ATTACHMENT_COMMAND: LexicalCommand<void> = createCommand('WHG_OPEN_ATTACHMENT');
