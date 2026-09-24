'use client';

import type { ToolbarGroupItem } from '@payloadcms/richtext-lexical';
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client';
import { COMMAND_PRIORITY_EDITOR } from '@payloadcms/richtext-lexical/lexical';
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext';
import { useTranslation } from '@payloadcms/ui';
import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

import { BlockPicker, type PickerColumn, type PickerItem } from './block-picker';
import { OPEN_BLOCK_PICKER_COMMAND } from './insert-commands';
import { frequentFirst } from './block-menu-items';
import type { BlockPickerProps } from './curated-blocks.client';

/** Что редактор передаёт подписи пункта. */
type LabelArgs = Parameters<Extract<ToolbarGroupItem['label'], (...args: never[]) => string>>[0];

/**
 * Колонка редактора на экране, пока окно открыто.
 *
 * @remarks
 * Меряется контейнер самого редактора, а не разметка админки вокруг: его
 * отдаёт контекст редактора, и он не зависит от того, как админка раскладывает
 * форму и предпросмотр.
 */
function useEditorColumn(
  container: RefObject<HTMLElement | null>,
  active: boolean,
): PickerColumn | null {
  const [column, setColumn] = useState<PickerColumn | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!active || !element) return;

    const measure = () => {
      const { left, width } = element.getBoundingClientRect();
      setColumn({ left, width });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [container, active]);

  return active ? column : null;
}

/**
 * Окно «Другие компоненты» у одного редактора.
 *
 * @remarks
 * Открывается командой редактора. Пункты приходят от фичи блоков - это
 * штатные пункты редактора: подпись, значок и вставка у них свои, здесь
 * не повторяются.
 */
export function BlockPickerPlugin({ clientProps }: { readonly clientProps: BlockPickerProps }) {
  const [editor] = useLexicalComposerContext();
  const { editorContainerRef, fieldProps } = useEditorConfigContext();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [startQuery, setStartQuery] = useState('');
  const column = useEditorColumn(editorContainerRef, open);

  useEffect(
    () =>
      editor.registerCommand(
        OPEN_BLOCK_PICKER_COMMAND,
        (initialQuery) => {
          setStartQuery(initialQuery ?? '');
          setOpen(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    [editor],
  );

  if (!open) return null;

  const blocks = frequentFirst(clientProps.items, clientProps.frequent);
  const labelArgs = {
    featureClientSchemaMap: fieldProps.featureClientSchemaMap,
    i18n,
    schemaPath: fieldProps.schemaPath,
  } as LabelArgs;
  const items: PickerItem[] = blocks.map((item) => ({
    key: item.key,
    label: typeof item.label === 'function' ? item.label(labelArgs) : (item.label ?? item.key),
    Icon: item.ChildComponent,
  }));

  const close = () => setOpen(false);
  const pick = (key: string) => {
    close();
    blocks.find((item) => item.key === key)?.onSelect?.({ editor, isActive: false });
  };

  return createPortal(
    <BlockPicker
      items={items}
      column={column}
      initialQuery={startQuery}
      onPick={pick}
      onClose={close}
    />,
    document.body,
  );
}
