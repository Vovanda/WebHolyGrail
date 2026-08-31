'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';
import { $getRoot, $getSelection } from '@payloadcms/richtext-lexical/lexical';
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

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
function МестоВставкиВКонце() {
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

export const CaretReadyClientFeature = createClientFeature({
  plugins: [{ Component: МестоВставкиВКонце, position: 'normal' }],
});
