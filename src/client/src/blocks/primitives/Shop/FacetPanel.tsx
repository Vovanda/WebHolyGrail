import { type Characteristic, type Facet, type FilterState, toggleValue } from 'contracts';

import { catalogHref } from '@/lib/shop/catalog-href';

/**
 * Расширенный фильтр выдачи по характеристикам (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Рисуется на сервере и работает без JS (R14): значение перечня - ссылка с
 * новым состоянием в адресе (R13), диапазон - форма GET. Значение, при котором
 * позиций не останется, видно приглушённым. Запрос поиска `q` переносится из
 * ссылки в ссылку.
 *
 * Характеристики идут группами раздела («Основные», «Размеры»); у да/нет одна
 * галочка с названием характеристики, а не пара «да» и «нет».
 *
 * Части: `facets` - весь фильтр, `facet-group` - группа, `facet` - характеристика,
 * `facet-option` - значение, `facet-range` - форма диапазона.
 */
export function FacetPanel({
  basePath,
  facets,
  state,
  characteristics,
  query,
}: {
  readonly basePath: string;
  readonly facets: readonly Facet[];
  readonly state: FilterState;
  readonly characteristics: readonly Characteristic[];
  readonly query: string;
}) {
  if (facets.length === 0) return null;

  const href = (next: FilterState) => catalogHref(basePath, next, characteristics, query);
  const groups = groupOf(facets);

  return (
    <nav data-part="facets" aria-label="Фильтр" className="text-sm">
      {groups.map(({ title, items }) => (
        <section
          key={title ?? ''}
          data-part="facet-group"
          className="border-t border-border py-4 first:border-t-0 first:pt-0"
        >
          {title && <h3 className="mb-3 font-display text-base font-semibold text-ink">{title}</h3>}
          <div className="grid gap-5">
            {items.map((facet) => (
              <section key={facet.key} data-part="facet">
                {!(facet.view === 'checks' && facet.kind === 'bool') && (
                  <h4 className="mb-2 font-medium text-ink">
                    {facet.title}
                    {facet.unit ? `, ${facet.unit}` : ''}
                  </h4>
                )}
                {facet.view === 'checks' ? (
                  <ul className="grid gap-0.5">
                    {facet.options
                      .filter((o) => facet.kind !== 'bool' || o.value === 'да')
                      .map((option) => (
                        <li key={option.value}>
                          <a
                            href={href(toggleValue(state, facet.key, option.value))}
                            rel="nofollow"
                            data-part="facet-option"
                            aria-current={option.selected ? 'true' : undefined}
                            className={`-mx-2 flex min-h-9 items-center gap-2.5 rounded-md px-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent ${
                              option.count === 0 && !option.selected ? 'opacity-50' : ''
                            }`}
                          >
                            <Check on={option.selected} />
                            <span className="text-ink">
                              {facet.kind === 'bool' ? facet.title : option.value}
                            </span>
                            <span className="ml-auto tabular-nums text-muted">{option.count}</span>
                          </a>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <form
                    method="get"
                    action={basePath}
                    data-part="facet-range"
                    className="grid grid-cols-2 gap-2"
                  >
                    {/* Остальные условия едут вместе с диапазоном. */}
                    {[
                      ...new URLSearchParams(href(without(state, facet.key)).split('?')[1] ?? ''),
                    ].map(([name, value]) => (
                      <input key={name} type="hidden" name={name} value={value} />
                    ))}
                    <label className="grid gap-1">
                      <span className="text-xs text-muted">от</span>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        name={`${facet.key}.min`}
                        defaultValue={facet.selected.min ?? ''}
                        placeholder={String(facet.bounds.min)}
                        className={rangeInput}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs text-muted">до</span>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        name={`${facet.key}.max`}
                        defaultValue={facet.selected.max ?? ''}
                        placeholder={String(facet.bounds.max)}
                        className={rangeInput}
                      />
                    </label>
                    <button
                      type="submit"
                      className="col-span-2 min-h-9 rounded-md border border-border-strong text-ink transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      Применить
                    </button>
                  </form>
                )}
              </section>
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

/** Галочка: рамка видна в обеих темах, выбранная - залита акцентом. */
function Check({ on }: { readonly on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border ${
        on ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong bg-bg'
      }`}
    >
      {on && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/** Фасеты по группам раздела, в порядке первого появления; без группы - первыми. */
function groupOf(facets: readonly Facet[]) {
  const groups: { title: string | null; items: Facet[] }[] = [];
  for (const facet of facets) {
    const found = groups.find((g) => g.title === facet.group);
    if (found) found.items.push(facet);
    else groups.push({ title: facet.group, items: [facet] });
  }
  return groups.sort((a, b) => Number(a.title !== null) - Number(b.title !== null));
}

/** Состояние без условия одной характеристики - его заменит форма диапазона. */
function without(state: FilterState, key: string): FilterState {
  const next = { ...state };
  delete next[key];
  return next;
}

const rangeInput =
  'w-full rounded-md border border-border-strong bg-bg px-2.5 py-2 tabular-nums text-ink outline-none placeholder:text-muted focus:border-accent';
