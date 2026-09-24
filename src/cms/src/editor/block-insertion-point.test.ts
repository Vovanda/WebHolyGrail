import {
  $createNodeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  createEditor,
  DecoratorNode,
  type LexicalEditor,
} from '@payloadcms/richtext-lexical/lexical';
import { describe, expect, it } from 'vitest';

import { $prepareBlockInsertionPoint } from './block-insertion-point';

/** Картинка в тексте: узел без каретки внутри, как upload у редактора. */
class PictureNode extends DecoratorNode<null> {
  static override getType() {
    return 'picture';
  }
  static override clone(node: PictureNode) {
    return new PictureNode(node.__key);
  }
  static override importJSON() {
    return new PictureNode();
  }
  override createDOM(): HTMLElement {
    throw new Error('в тесте разметки нет');
  }
  override updateDOM() {
    return false;
  }
  override decorate() {
    return null;
  }
}

function editorWith(build: () => void): LexicalEditor {
  const editor = createEditor({
    nodes: [PictureNode],
    onError: (error) => {
      throw error;
    },
  });
  editor.update(build, { discrete: true });
  return editor;
}

/** Где стоит каретка: номер узла верхнего уровня и смещение. */
function caret(editor: LexicalEditor) {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    const node = selection.anchor.getNode();
    const top = node.getTopLevelElement() ?? node;
    return {
      index: top === $getRoot() ? selection.anchor.offset : top.getIndexWithinParent(),
      type: selection.anchor.type,
    };
  });
}

describe('место под вставку блока', () => {
  it('выделенная картинка уступает место каретке сразу за собой', () => {
    const editor = editorWith(() => {
      const picture = new PictureNode();
      $getRoot().append(
        $createParagraphNode().append($createTextNode('до')),
        picture,
        $createParagraphNode(),
      );
      const selection = $createNodeSelection();
      selection.add(picture.getKey());
      $setSelection(selection);
    });

    editor.update($prepareBlockInsertionPoint, { discrete: true });

    expect(caret(editor)).toEqual({ index: 2, type: 'element' });
  });

  it('картинка последней в тексте - каретка встаёт после неё', () => {
    const editor = editorWith(() => {
      const picture = new PictureNode();
      $getRoot().append($createParagraphNode(), picture);
      const selection = $createNodeSelection();
      selection.add(picture.getKey());
      $setSelection(selection);
    });

    editor.update($prepareBlockInsertionPoint, { discrete: true });

    expect(caret(editor)).toEqual({ index: 2, type: 'element' });
  });

  it('без выделения каретка встаёт в конец текста', () => {
    const editor = editorWith(() => {
      $getRoot().append($createParagraphNode().append($createTextNode('текст')));
      $setSelection(null);
    });

    editor.update($prepareBlockInsertionPoint, { discrete: true });

    expect(caret(editor)).not.toBeNull();
  });

  it('стоящая каретка не двигается', () => {
    const editor = editorWith(() => {
      const first = $createParagraphNode().append($createTextNode('первый'));
      $getRoot().append(first, $createParagraphNode().append($createTextNode('второй')));
      first.selectStart();
    });

    editor.update($prepareBlockInsertionPoint, { discrete: true });

    expect(caret(editor)).toEqual({ index: 0, type: 'text' });
  });
});
