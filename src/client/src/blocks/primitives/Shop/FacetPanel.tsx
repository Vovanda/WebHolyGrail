import type { Facet } from 'contracts';

import { FacetOptions, type FilterPlace, RangeForm } from './facet-parts';

/**
 * Расширенный фильтр выдачи по характеристикам (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Рисуется на сервере и работает без JS (R14): значение перечня - ссылка с
 * новым состоянием в адресе (R13), диапазон - форма GET. С JS переходы идут
 * без перезагрузки страницы.
 *
 * Характеристики идут группами раздела («Основные», «Размеры»); у да/нет одна
 * галочка с названием характеристики, а не пара «да» и «нет».
 *
 * Части: `facets` - весь фильтр, `facet-group` - группа, `facet` - характеристика,
 * `facet-option` - значение, `facet-range` - форма диапазона.
 */
export function FacetPanel({
  place,
  facets,
}: {
  readonly place: FilterPlace;
  readonly facets: readonly Facet[];
}) {
  if (facets.length === 0) return null;
  return (
    <nav data-part="facets" aria-label="Фильтр" className="text-sm">
      {groupOf(facets).map(({ title, items }) => (
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
                  <FacetOptions place={place} facet={facet} />
                ) : (
                  <RangeForm place={place} facet={facet} />
                )}
              </section>
            ))}
          </div>
        </section>
      ))}
    </nav>
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
