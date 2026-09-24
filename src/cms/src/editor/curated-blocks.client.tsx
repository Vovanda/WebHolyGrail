'use client';

import type {
  SlashMenuGroup,
  SlashMenuItem,
  ToolbarGroup,
  ToolbarGroupItem,
} from '@payloadcms/richtext-lexical';
import {
  BlocksFeatureClient,
  createClientFeature,
  toolbarAddDropdownGroupWithItems,
} from '@payloadcms/richtext-lexical/client';

import { BLOCKS_GROUP_KEY, pickFrequent } from './block-menu-items';
import { BlockPickerPlugin } from './block-picker.plugin';
import type { CuratedBlocksClientProps } from './curated-blocks';
import { OPEN_BLOCK_PICKER_COMMAND } from './insert-commands';
import { MenuSeparator } from './menu-separator';

/** Что получает окно «Другие компоненты»: частые и весь набор пунктов блоков. */
export interface BlockPickerProps extends CuratedBlocksClientProps {
  readonly items: readonly ToolbarGroupItem[];
}

const OTHER_LABEL = 'Другие компоненты';

/**
 * Штатная фича блоков с коротким меню.
 *
 * @remarks
 * Пункты не строятся заново: подпись, значок и вставку даёт штатная часть,
 * здесь из её пунктов отбираются частые. Отдельная кнопка блоков в панели
 * уходит - частые встают в общий «+» под чертой, после штатных пунктов.
 * У них нет номера: пункты без номера идут в порядке загрузки фич, и эта
 * фича должна загружаться после штатных (см. её место в `Articles.ts`).
 */
export const CuratedBlocksClientFeature = createClientFeature<
  CuratedBlocksClientProps,
  BlockPickerProps
>((args) => {
  const provider = BlocksFeatureClient(args.props as Parameters<typeof BlocksFeatureClient>[0]);
  const stock = typeof provider.feature === 'function' ? provider.feature(args) : provider.feature;
  const frequent = args.props.frequent;

  const toolbarGroups: readonly ToolbarGroup[] = stock.toolbarFixed?.groups ?? [];
  const allItems = toolbarGroups.find((group) => group.key === BLOCKS_GROUP_KEY)?.items ?? [];

  const icon = blocksIcon(toolbarGroups);
  const other: ToolbarGroupItem = {
    ...(icon ? { ChildComponent: icon } : {}),
    key: 'insert-other-block',
    label: OTHER_LABEL,
    onSelect: ({ editor }) => {
      editor.dispatchCommand(OPEN_BLOCK_PICKER_COMMAND, undefined);
    },
  };
  const separator: ToolbarGroupItem = { key: 'insert-separator', Component: MenuSeparator };
  // Номер снят: пункты с номером редактор ставит выше штатных без номера.
  const frequentItems = pickFrequent(allItems, frequent).map(
    ({ order: _order, ...item }): ToolbarGroupItem => ({ ...item, key: `insert-${item.key}` }),
  );
  const addItems: ToolbarGroupItem[] = [separator, ...frequentItems, other];

  const slashGroups: SlashMenuGroup[] = (stock.slashMenu?.groups ?? []).map((group) => {
    if (group.key !== BLOCKS_GROUP_KEY || !group.items[0]) return group;
    return {
      ...group,
      items: [
        ...pickFrequent(group.items, frequent),
        otherSlashItem(group.items[0].Icon, args.props.searchWords),
      ],
    };
  });

  return {
    ...stock,
    plugins: [...(stock.plugins ?? []), { Component: BlockPickerPlugin, position: 'normal' }],
    sanitizedClientFeatureProps: { ...args.props, items: allItems },
    slashMenu: { ...stock.slashMenu, groups: slashGroups },
    toolbarFixed: {
      groups: [
        ...toolbarGroups.filter((group) => group.key !== BLOCKS_GROUP_KEY),
        toolbarAddDropdownGroupWithItems(addItems),
      ],
    },
  };
});

/** Значок группы блоков - им помечены «Другие компоненты». */
function blocksIcon(
  groups: readonly ToolbarGroup[],
): ToolbarGroupItem['ChildComponent'] | undefined {
  const group = groups.find((candidate) => candidate.key === BLOCKS_GROUP_KEY);
  return group?.type === 'dropdown' ? group.ChildComponent : undefined;
}

/**
 * «Другие компоненты» в слэш-меню находятся и по имени любого блока набора:
 * окно открывается сразу с набранным запросом.
 */
function otherSlashItem(
  Icon: SlashMenuItem['Icon'],
  searchWords: readonly string[],
): SlashMenuItem {
  return {
    Icon,
    key: 'insert-other-block',
    keywords: ['компонент', 'блок', 'другие', 'block', 'component', ...searchWords],
    label: OTHER_LABEL,
    onSelect: ({ editor, queryString }) => {
      editor.dispatchCommand(OPEN_BLOCK_PICKER_COMMAND, queryString || undefined);
    },
  };
}
