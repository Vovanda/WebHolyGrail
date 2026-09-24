import {
  $getPreviousSelection,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isRootNode,
  type LexicalNode,
} from '@payloadcms/richtext-lexical/lexical';

/** Узел верхнего уровня, в котором стоит данный: его прямой родитель - корень. */
function $topLevelOf(node: LexicalNode): LexicalNode {
  let current = node;
  for (
    let parent = current.getParent();
    parent && !$isRootNode(parent);
    parent = current.getParent()
  ) {
    current = parent;
  }
  return current;
}

/**
 * Готовит каретку под вставку блока. Зовётся внутри `editor.update`.
 *
 * @remarks
 * Редактор вставляет блок только туда, где стоит каретка, и молча ничего
 * не делает при любом другом выделении. Выделенная картинка - обычное дело:
 * владелец нажал на фото, потом на «+», и блок не появился.
 *
 * Поэтому выделенный узел уступает каретке сразу за собой, а без выделения
 * каретка встаёт в конец текста. Каретку не трогаем.
 */
export function $prepareBlockInsertionPoint(): void {
  const selection = $getSelection() ?? $getPreviousSelection();
  if ($isRangeSelection(selection)) return;

  const selected = $isNodeSelection(selection) ? selection.getNodes() : [];
  const last = selected.at(-1);
  if (last) {
    $topLevelOf(last).selectNext();
    return;
  }
  $getRoot().selectEnd();
}
