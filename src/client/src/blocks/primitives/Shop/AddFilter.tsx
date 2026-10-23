import type { Facet } from 'contracts';

import { Dropdown } from '@/blocks/primitives/Dropdown';

import { FacetOptions, type FilterPlace, RangeForm } from './facet-parts';

/**
 * «+ Свойство»: выбрать любую характеристику выдачи и её значение - как
 * фильтр в списках админки Payload.
 *
 * @remarks
 * В списке характеристики, которых нет в быстрых фильтрах; каждая раскрывается
 * на месте своими значениями или диапазоном. Выбранное встаёт таблеткой
 * в строке условий (`ActiveFilters`).
 *
 * Части: `add-filter` - кубик, `add-filter-item` - характеристика.
 */
export function AddFilter({
  place,
  facets,
}: {
  readonly place: FilterPlace;
  readonly facets: readonly Facet[];
}) {
  const quick = new Set(place.characteristics.filter((c) => c.quick).map((c) => c.key));
  const rest = facets.filter((f) => !quick.has(f.key));
  if (rest.length === 0) return null;
  return (
    <Dropdown label="+ Свойство" className="[&_[data-part=dropdown-panel]]:w-72">
      <ul data-part="add-filter" className="grid">
        {rest.map((facet) => (
          <li key={facet.key} data-part="add-filter-item">
            <details className="group/item">
              <summary className="-mx-2 flex min-h-9 cursor-pointer list-none items-center justify-between rounded-md px-2 text-sm text-ink hover:bg-surface-hover [&::-webkit-details-marker]:hidden">
                {facet.title}
                {facet.unit ? `, ${facet.unit}` : ''}
                <span aria-hidden="true" className="text-muted group-open/item:rotate-90">
                  ›
                </span>
              </summary>
              <div className="pb-2 pl-2 pt-1">
                {facet.view === 'checks' ? (
                  <FacetOptions place={place} facet={facet} />
                ) : (
                  <RangeForm place={place} facet={facet} />
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Dropdown>
  );
}
