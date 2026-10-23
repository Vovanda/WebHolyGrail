import { type Characteristic, type FilterState, type QuickFilter, toggleValue } from 'contracts';

import { catalogHref } from '@/lib/shop/catalog-href';

/**
 * Строка быстрых фильтров над плиткой: «В наличии», «Со скидкой» и значения
 * характеристик с отметкой «в быстрых фильтрах».
 *
 * @remarks
 * Рисуется на сервере, переключатель - ссылка (R13, R14) на тот же адрес, что
 * галочка в панели расширенного фильтра. Строка переносится, а не обрезается:
 * спрятанный за край переключатель не найти. Части: `quick` - строка,
 * `quick-option` - переключатель.
 */
export function QuickFilters({
  items,
  basePath,
  state,
  characteristics,
  query,
}: {
  readonly items: readonly QuickFilter[];
  readonly basePath: string;
  readonly state: FilterState;
  readonly characteristics: readonly Characteristic[];
  readonly query: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul data-part="quick" aria-label="Быстрые фильтры" className="contents">
      {items.map((item) => (
        <li key={`${item.key}=${item.value}`}>
          <a
            href={catalogHref(
              basePath,
              toggleValue(state, item.key, item.value),
              characteristics,
              query,
            )}
            rel="nofollow"
            data-part="quick-option"
            aria-current={item.selected ? 'true' : undefined}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              item.selected
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-border bg-surface text-ink hover:border-border-strong'
            }`}
          >
            {item.label}
            <span className={item.selected ? 'opacity-80' : 'text-muted'}>{item.count}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
