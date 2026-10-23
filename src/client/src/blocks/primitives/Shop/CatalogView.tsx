import { type Facet, type SortKey, writeFilter } from 'contracts';
import { Suspense } from 'react';

import { DropdownCloser } from '@/blocks/primitives/DropdownCloser';

import { ActiveFilters } from './ActiveFilters';
import { AddFilter } from './AddFilter';
import { CatalogFilters } from './CatalogFilters';
import { CatalogPager } from './CatalogPager';
import { FacetPanel } from './FacetPanel';
import { type FilterPlace, placeHref } from './facet-parts';
import { QuickFilters } from './QuickFilters';
import { SortMenu } from './SortMenu';

/**
 * Выдача каталога: строка фильтров, выбранные условия, плитка и страницы -
 * одинаково на `/shop` и в разделе (docs/whg/44-catalog-search.md, «Страница раздела»).
 *
 * @remarks
 * Всё стоит одной колонкой шириной с плитку. В строке фильтров слева «Все
 * фильтры» (боковая панель), быстрые фильтры и «+ Свойство», справа сортировка
 * и счёт. Переходы - ссылками без перезагрузки (R13, R14).
 *
 * Что показать под строкой, решает страница: плитку найденного или, на `/shop`
 * без условий, разделы блоками - тогда `result` пуст и строки счёта и страниц
 * нет. Части: `catalog-bar`, `result-count`.
 */
export function CatalogView({
  place,
  facets,
  result,
  empty,
  children,
}: {
  readonly place: FilterPlace;
  readonly facets: readonly Facet[];
  /** Число найденного и страницы; пусто - разделы блоками без счёта. */
  readonly result: {
    readonly total: number;
    readonly page: number;
    readonly pages: number;
    readonly shown: number;
    readonly sort: SortKey;
  } | null;
  /** Текст, когда позиций нет совсем, а не по условиям. */
  readonly empty?: string | undefined;
  readonly children: React.ReactNode;
}) {
  const selected = [...new URLSearchParams(writeFilter(place.state, place.characteristics))].length;
  const filtered = selected > 0 || place.query !== '';
  return (
    <div className="mt-6 grid gap-4">
      <div
        data-part="catalog-bar"
        className="flex flex-col-reverse gap-3 border-b border-border pb-4 md:flex-row md:items-start md:gap-4"
      >
        {/* Переключатели переносятся строками; сортировка и счёт - справа, на узком экране строкой сверху. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 [&_a]:whitespace-nowrap [&_summary]:whitespace-nowrap [&_button]:whitespace-nowrap">
          {facets.length > 0 && (
            <CatalogFilters
              found={result?.total ?? 0}
              selected={selected}
              resetHref={selected > 0 ? placeHref(place, {}) : null}
            >
              <FacetPanel place={place} facets={facets} />
            </CatalogFilters>
          )}
          <QuickFilters place={place} facets={facets} />
          <AddFilter place={place} facets={facets} />
        </div>
        {result && (
          <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
            <p
              data-part="result-count"
              className="order-first text-sm tabular-nums text-muted md:order-last"
            >
              {result.total > 0 ? `Найдено ${result.total}` : ''}
            </p>
            {result.total > 1 && <SortMenu place={place} sort={result.sort} />}
          </div>
        )}
      </div>

      <ActiveFilters place={place} />

      {result && result.total === 0 ? (
        <p className="py-12 text-center text-muted">
          {filtered
            ? 'Ничего не нашлось - смягчите фильтр или запрос.'
            : (empty ?? 'Здесь пока нет позиций.')}
        </p>
      ) : (
        <>
          {children}
          {result && (
            <CatalogPager
              place={place}
              page={result.page}
              pages={result.pages}
              shown={result.shown}
              total={result.total}
            />
          )}
        </>
      )}

      <Suspense>
        <DropdownCloser />
      </Suspense>
    </div>
  );
}
