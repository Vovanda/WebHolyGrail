import {
  type Characteristic,
  type Facet,
  type FilterState,
  toggleValue,
  writeFilter,
} from 'contracts';

/**
 * Фильтр раздела каталога по характеристикам (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Рисуется на сервере и работает без JS (R14): значение перечня - ссылка с
 * новым состоянием в адресе (R13), диапазон - форма GET. Ссылкой на подборку
 * делятся, поиск её индексирует. Значение, при котором позиций не останется,
 * видно приглушённым. Запрос поиска `q` переносится из ссылки в ссылку.
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

  const href = (next: FilterState) => {
    const params = new URLSearchParams(writeFilter(next, characteristics));
    if (query) params.set('q', query);
    const s = params.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const reset = Object.keys(state).length > 0;

  return (
    <nav data-part="facets" aria-label="Фильтр" className="grid gap-6 text-sm">
      {facets.map((facet) => (
        <section key={facet.key} data-part="facet">
          <h3 className="mb-2 font-medium text-ink">
            {facet.title}
            {facet.unit ? `, ${facet.unit}` : ''}
          </h3>
          {facet.view === 'checks' ? (
            <ul className="grid gap-1.5">
              {facet.options.map((option) => (
                <li key={option.value}>
                  <a
                    href={href(toggleValue(state, facet.key, option.value))}
                    rel="nofollow"
                    aria-current={option.selected ? 'true' : undefined}
                    className={`flex items-center gap-2 ${
                      option.count === 0 && !option.selected ? 'text-muted opacity-60' : 'text-ink'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        option.selected ? 'border-accent bg-accent text-accent-fg' : 'border-border'
                      }`}
                    >
                      {option.selected ? '✓' : ''}
                    </span>
                    <span>{option.value}</span>
                    <span className="ml-auto tabular-nums text-muted">{option.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <form method="get" action={basePath} className="flex items-center gap-2">
              {/* Остальные условия едут вместе с диапазоном. */}
              {[...new URLSearchParams(href(rangeless(state, facet.key)).split('?')[1] ?? '')].map(
                ([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ),
              )}
              <input
                type="number"
                step="any"
                name={`${facet.key}.min`}
                defaultValue={facet.selected.min ?? ''}
                placeholder={String(facet.bounds.min)}
                aria-label={`${facet.title} от`}
                className={rangeInput}
              />
              <span className="text-muted">-</span>
              <input
                type="number"
                step="any"
                name={`${facet.key}.max`}
                defaultValue={facet.selected.max ?? ''}
                placeholder={String(facet.bounds.max)}
                aria-label={`${facet.title} до`}
                className={rangeInput}
              />
              <button
                type="submit"
                className="rounded-md border border-border px-2 py-1.5 text-ink"
              >
                ОК
              </button>
            </form>
          )}
        </section>
      ))}
      {reset && (
        <a
          href={query ? `${basePath}?q=${encodeURIComponent(query)}` : basePath}
          className="text-accent"
        >
          Сбросить фильтр
        </a>
      )}
    </nav>
  );
}

/** Состояние без условия одной характеристики - его заменит форма диапазона. */
function rangeless(state: FilterState, key: string): FilterState {
  const next = { ...state };
  delete next[key];
  return next;
}

const rangeInput =
  'w-20 rounded-md border border-border bg-bg px-2 py-1.5 text-ink outline-none focus:border-accent';
