import { type Characteristic, type Facet, toggleValue } from 'contracts';
import Link from 'next/link';

import { Dropdown } from '@/blocks/primitives/Dropdown';

import { FacetOptions, type FilterPlace, placeHref } from './facet-parts';

/**
 * Быстрые фильтры над плиткой: характеристики с отметкой «в быстрых фильтрах».
 *
 * @remarks
 * У да/нет («В наличии», «Со скидкой») - переключатель одним нажатием. У перечня
 * - одна кнопка «Бренд ▾» со списком значений: строка не разрастается, сколько
 * бы брендов ни было. Переключатель и значение - ссылки на тот же адрес, что
 * галочка в панели расширенного фильтра (R13, R14).
 *
 * Части: `quick-option` - переключатель, `dropdown` - список характеристики.
 */
export function QuickFilters({
  place,
  facets,
}: {
  readonly place: FilterPlace;
  readonly facets: readonly Facet[];
}) {
  const quick = new Map(place.characteristics.map((c) => [c.key, c] as const));
  return facets
    .filter((f) => quick.get(f.key)?.quick && f.view === 'checks')
    .map((facet) => {
      if (facet.view !== 'checks') return null;
      const c = quick.get(facet.key) as Characteristic;
      if (c.kind === 'bool') {
        const yes = facet.options.find((o) => o.value === 'да');
        if (!yes || (!yes.selected && yes.count === 0)) return null;
        return (
          <Link
            key={facet.key}
            href={placeHref(place, toggleValue(place.state, facet.key, 'да'))}
            scroll={false}
            rel="nofollow"
            data-part="quick-option"
            aria-current={yes.selected ? 'true' : undefined}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              yes.selected
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-border bg-surface text-ink hover:border-border-strong'
            }`}
          >
            {c.title}
            <span className={yes.selected ? 'opacity-80' : 'text-muted'}>{yes.count}</span>
          </Link>
        );
      }
      const chosen = facet.options.filter((o) => o.selected).length;
      return (
        <Dropdown
          key={facet.key}
          active={chosen > 0}
          label={
            <>
              {c.title}
              {chosen > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-xs tabular-nums text-accent-fg">
                  {chosen}
                </span>
              )}
            </>
          }
        >
          <FacetOptions place={place} facet={facet} />
        </Dropdown>
      );
    });
}
