'use client';

import type { ToolbarGroupItem } from '@payloadcms/richtext-lexical';
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client';

/**
 * Значок штатного пункта панели редактора.
 *
 * @remarks
 * Значки редактор наружу не отдаёт, а свои пункты объявляются раньше, чем он
 * соберёт штатные. Поэтому значок берётся из готовой группы в момент
 * отрисовки: свой пункт выглядит так же, как штатный рядом с ним.
 */
export function useToolbarIcon(
  groupKey: string,
  itemKey: string,
): ToolbarGroupItem['ChildComponent'] | undefined {
  const { editorConfig } = useEditorConfigContext();
  return editorConfig.features.toolbarFixed.groups
    .find((group) => group.key === groupKey)
    ?.items.find((item) => item.key === itemKey)?.ChildComponent;
}
