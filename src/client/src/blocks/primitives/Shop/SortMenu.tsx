import { SORTS, type SortKey } from 'contracts';
import Link from 'next/link';

import { Dropdown } from '@/blocks/primitives/Dropdown';

import { type FilterPlace, placeHref } from './facet-parts';

/**
 * Порядок выдачи списком: «По умолчанию», цена, скидка, новинки.
 *
 * @remarks
 * Порядок стоит в адресе `?sort=` (R13); условия фильтра и запрос сохраняются.
 * Части: `sort` - кубик, `sort-option` - вариант.
 */
export function SortMenu({ place, sort }: { readonly place: FilterPlace; readonly sort: SortKey }) {
  const current = SORTS.find((s) => s.key === sort) ?? SORTS[0]!;
  return (
    <Dropdown label={current.title} align="end">
      <ul data-part="sort" className="grid gap-0.5">
        {SORTS.map((option) => (
          <li key={option.key}>
            <Link
              href={placeHref({ ...place, sort: option.key }, place.state)}
              scroll={false}
              rel="nofollow"
              data-part="sort-option"
              aria-current={option.key === sort ? 'true' : undefined}
              className={`-mx-2 flex min-h-9 items-center rounded-md px-2 text-sm transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent ${
                option.key === sort ? 'font-medium text-accent' : 'text-ink'
              }`}
            >
              {option.title}
            </Link>
          </li>
        ))}
      </ul>
    </Dropdown>
  );
}
