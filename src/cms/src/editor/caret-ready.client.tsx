'use client';

import { createClientFeature, INSERT_BLOCK_COMMAND } from '@payloadcms/richtext-lexical/client';
import {
  $getRoot,
  $getSelection,
  COMMAND_PRIORITY_HIGH,
} from '@payloadcms/richtext-lexical/lexical';
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { $prepareBlockInsertionPoint } from './block-insertion-point';

/**
 * Ставит место вставки в конец текста, пока владелец никуда не нажал.
 *
 * @remarks
 * Кнопки панели вставляют по месту, где стоит курсор. Пока в тексте не нажали,
 * места нет, и кнопка молча ничего не делает: владелец жмёт «Складной кусок»,
 * а в тексте ничего не появляется. На телефоне это обычный порядок действий -
 * страница открылась, палец сразу пошёл к панели.
 *
 * Поэтому при появлении редактора место вставки назначается в конец текста.
 * Ввод с клавиатуры это не начинает и её на телефоне не поднимает: назначается
 * место, а не переход в поле.
 */
function TrailingCaret() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(
      () => {
        if ($getSelection() !== null) return;
        $getRoot().selectEnd();
      },
      { discrete: true },
    );
  }, [editor]);

  return null;
}

/**
 * Перед вставкой блока выделенный узел уступает место каретке.
 *
 * @remarks
 * Редактор вставляет блок только в каретку, а при выделенной картинке молча
 * ничего не делает. Здесь выделение приводится к каретке и команда уходит
 * дальше - вставляет по-прежнему сам редактор.
 */
function BlockInsertionPoint() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerCommand(
        INSERT_BLOCK_COMMAND,
        () => {
          editor.update($prepareBlockInsertionPoint);
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    [editor],
  );

  return null;
}

export const CaretReadyClientFeature = createClientFeature({
  plugins: [
    { Component: TrailingCaret, position: 'normal' },
    { Component: BlockInsertionPoint, position: 'normal' },
  ],
});
