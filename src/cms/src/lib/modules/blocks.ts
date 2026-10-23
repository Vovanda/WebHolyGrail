import type { Block, BlocksField } from 'payload';

import { disabledBlocks } from 'contracts';

import { readToggles } from '../toggles/source';

/**
 * Какие блоки можно поставить: без блоков выключенных модулей.
 *
 * @remarks
 * Payload пересчитывает `filterOptions` при каждом запросе состояния формы,
 * поэтому выключенный модуль убирает свои блоки из выбора без перезапуска.
 * Уже стоящий на странице блок такого модуля в списке остаётся: Payload
 * отклоняет сохранение документа с блоком вне `filterOptions`, и владелец не
 * смог бы поправить страницу, не удалив блок. Данные остаются, а сайт рисует
 * на месте такого блока заглушку того же размера.
 */
export function moduleBlockFilter(
  field: string,
  blocks: readonly Block[],
): NonNullable<BlocksField['filterOptions']> {
  return async ({ req, siblingData }) => {
    const off = new Set(disabledBlocks(await readToggles(req.payload)));
    if (off.size === 0) return true;
    const rows = (siblingData as Record<string, unknown> | undefined)?.[field];
    const present = new Set(
      (Array.isArray(rows) ? rows : []).map((r) =>
        String((r as { blockType?: unknown }).blockType),
      ),
    );
    return blocks.map((b) => b.slug).filter((slug) => !off.has(slug) || present.has(slug));
  };
}
