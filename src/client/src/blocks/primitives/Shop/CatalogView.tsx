import {
  type Characteristic,
  type Facet,
  type FilterState,
  quickFilters,
  writeFilter,
} from 'contracts';

import { catalogHref } from '@/lib/shop/catalog-href';

import { CatalogFilters } from './CatalogFilters';
import { FacetPanel } from './FacetPanel';
import { QuickFilters } from './QuickFilters';

/**
 * Выдача каталога: поиск, строка фильтров и то, что под ними, - одинаково на
 * `/shop` и в разделе (docs/whg/44-catalog-search.md, «Страница раздела»).
 *
 * @remarks
 * Всё стоит одной колонкой шириной с плитку: поиск во всю ширину, под ним
 * слева «Все фильтры» и быстрые фильтры, справа «Найдено N». Расширенный
 * фильтр - боковая панель (`CatalogFilters`), на странице он места не занимает.
 *
 * Что показать под строкой, решает страница: плитку найденного или, на `/shop`
 * без условий, разделы блоками. Части: `catalog-search`, `catalog-bar`,
 * `result-count`.
 */
export function CatalogView({
  basePath,
  query,
  state,
  characteristics,
  facets,
  found,
  searchLabel,
  children,
}: {
  readonly basePath: string;
  readonly query: string;
  readonly state: FilterState;
  readonly characteristics: readonly Characteristic[];
  readonly facets: readonly Facet[];
  /** Сколько найдено; пусто - счёт не показывается (разделы блоками). */
  readonly found: number | null;
  readonly searchLabel: string;
  readonly children: React.ReactNode;
}) {
  const filtered = writeFilter(state, characteristics);
  const selected = [...new URLSearchParams(filtered)].length;
  return (
    <div className="mt-6 grid gap-4">
      <form
        method="get"
        action={basePath}
        role="search"
        data-part="catalog-search"
        className="relative"
      >
        {[...new URLSearchParams(filtered)].map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="min-h-12 w-full rounded-lg border border-border-strong bg-bg pl-4 pr-28 text-ink outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          className="absolute inset-y-1.5 right-1.5 rounded-md bg-accent px-5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Найти
        </button>
      </form>

      <div data-part="catalog-bar" className="flex items-start gap-4 border-b border-border pb-4">
        {/* Переключатели переносятся строками, счёт держится справа на первой. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {facets.length > 0 && (
            <CatalogFilters
              found={found ?? 0}
              selected={selected}
              resetHref={selected > 0 ? catalogHref(basePath, {}, characteristics, query) : null}
            >
              <FacetPanel
                basePath={basePath}
                facets={facets}
                state={state}
                characteristics={characteristics}
                query={query}
              />
            </CatalogFilters>
          )}
          <QuickFilters
            items={quickFilters(facets, characteristics)}
            basePath={basePath}
            state={state}
            characteristics={characteristics}
            query={query}
          />
        </div>
        {found !== null && (
          <p
            data-part="result-count"
            className="flex min-h-10 shrink-0 items-center text-sm tabular-nums text-muted"
          >
            {found > 0 ? `Найдено ${found}` : 'Ничего не нашлось'}
          </p>
        )}
      </div>

      {found === 0 ? (
        <p className="py-12 text-center text-muted">
          Ничего не нашлось - смягчите фильтр или запрос.
        </p>
      ) : (
        children
      )}
    </div>
  );
}
