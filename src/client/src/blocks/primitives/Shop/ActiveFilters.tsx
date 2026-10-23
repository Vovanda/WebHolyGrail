import { type FilterState, toggleValue } from 'contracts';
import Link from 'next/link';

import { type FilterPlace, placeHref } from './facet-parts';

/**
 * Выбранные условия таблетками с крестиком и «Сбросить» - видно, чем сужена
 * выдача, и любое условие снимается одним нажатием.
 *
 * @remarks
 * Ссылки на тот же адрес без условия (R13): без JS работает так же. Части:
 * `active-filters` - строка, `active-filter` - условие, `active-reset` - сброс.
 */
export function ActiveFilters({ place }: { readonly place: FilterPlace }) {
  const pills: { key: string; label: string; next: FilterState }[] = [];
  for (const c of place.characteristics) {
    const s = place.state[c.key];
    if (!s) continue;
    if (s.values) {
      for (const value of s.values) {
        pills.push({
          key: `${c.key}=${value}`,
          label: c.kind === 'bool' ? c.title : `${c.title}: ${value}`,
          next: toggleValue(place.state, c.key, value),
        });
      }
    } else {
      const rest = { ...place.state };
      delete rest[c.key];
      const unit = c.unit ? ` ${c.unit}` : '';
      const span =
        s.min !== undefined && s.max !== undefined
          ? `${s.min}–${s.max}`
          : s.min !== undefined
            ? `от ${s.min}`
            : `до ${s.max}`;
      pills.push({ key: c.key, label: `${c.title}: ${span}${unit}`, next: rest });
    }
  }
  if (pills.length === 0) return null;
  return (
    <ul
      data-part="active-filters"
      aria-label="Выбранные условия"
      className="flex flex-wrap items-center gap-2"
    >
      {pills.map((pill) => (
        <li key={pill.key}>
          <Link
            href={placeHref(place, pill.next)}
            scroll={false}
            rel="nofollow"
            data-part="active-filter"
            aria-label={`Снять условие: ${pill.label}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm text-ink transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            {pill.label}
            <span aria-hidden="true" className="text-muted">
              ×
            </span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={placeHref(place, {})}
          scroll={false}
          data-part="active-reset"
          className="min-h-8 px-2 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Сбросить
        </Link>
      </li>
    </ul>
  );
}
