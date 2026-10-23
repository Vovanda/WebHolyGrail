import type { Block, BlocksField } from 'payload';

import { disabledBlocks, moduleOfBlock, MODULES } from 'contracts';

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

/**
 * Блоки в окне выбора сгруппированы по модулям.
 *
 * @remarks
 * Без группы блоки модулей стоят вперемешку с общими, и владелец ищет витрину
 * магазина среди героев и цитат. Блок без модуля идёт в «Стандартные»; своя группа
 * блока, если её задали, главнее.
 *
 * Окно выбора ставит группы в порядке первого блока, поэтому порядок здесь и есть
 * приоритет: сначала стандартные в порядке набора блоков (частые - выше), затем
 * модули в порядке меню. Внутри группы - порядок набора.
 */
export function groupedByModule(blocks: readonly Block[]): Block[] {
  const rank = (b: Block): number => {
    const key = moduleOfBlock(b.slug);
    return key ? 1 + MODULES.findIndex((m) => m.key === key) : 0;
  };
  return blocks
    .map((b, i) => ({ b, i, r: rank(b) }))
    .sort((x, y) => x.r - y.r || x.i - y.i)
    .map(({ b }) => {
      if (b.admin?.group) return b;
      const key = moduleOfBlock(b.slug);
      const group = key ? MODULES.find((m) => m.key === key)!.title : 'Стандартные';
      return { ...b, admin: { ...b.admin, group } };
    });
}
