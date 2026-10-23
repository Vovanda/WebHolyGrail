import {
  type Characteristic,
  type Facet,
  type FacetOption,
  type FilterState,
  toggleValue,
} from 'contracts';
import Form from 'next/form';
import Link from 'next/link';

import { catalogHref } from '@/lib/shop/catalog-href';

/** Где стоит фильтр: адрес выдачи, её состояние и запрос - для ссылок значений. */
export interface FilterPlace {
  readonly basePath: string;
  readonly state: FilterState;
  readonly characteristics: readonly Characteristic[];
  readonly query: string;
  readonly sort: string;
}

/** Адрес выдачи с новым состоянием фильтра: сортировка и запрос сохраняются. */
export function placeHref(place: FilterPlace, next: FilterState): string {
  const href = catalogHref(place.basePath, next, place.characteristics, place.query);
  if (place.sort === 'default') return href;
  return `${href}${href.includes('?') ? '&' : '?'}sort=${place.sort}`;
}

/**
 * Значение перечня: галочка, подпись, счётчик - ссылка на выдачу с ним или без него.
 *
 * @remarks
 * Переход без перезагрузки и без прокрутки наверх (`Link`), без JS - обычная
 * ссылка (R14). Значение, при котором позиций не останется, приглушено.
 */
export function FacetOptionLink({
  place,
  facet,
  option,
}: {
  readonly place: FilterPlace;
  readonly facet: Facet;
  readonly option: FacetOption;
}) {
  return (
    <Link
      href={placeHref(place, toggleValue(place.state, facet.key, option.value))}
      scroll={false}
      rel="nofollow"
      data-part="facet-option"
      aria-current={option.selected ? 'true' : undefined}
      className={`-mx-2 flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent ${
        option.count === 0 && !option.selected ? 'opacity-50' : ''
      }`}
    >
      <Check on={option.selected} />
      <span className="text-ink">{facet.kind === 'bool' ? facet.title : option.value}</span>
      <span className="ml-auto pl-3 tabular-nums text-muted">{option.count}</span>
    </Link>
  );
}

/** Значения характеристики-перечня; у да/нет - одна галочка с названием. */
export function FacetOptions({
  place,
  facet,
}: {
  readonly place: FilterPlace;
  readonly facet: Facet;
}) {
  if (facet.view !== 'checks') return null;
  return (
    <ul className="grid gap-0.5">
      {facet.options
        .filter((o) => facet.kind !== 'bool' || o.value === 'да')
        .map((option) => (
          <li key={option.value}>
            <FacetOptionLink place={place} facet={facet} option={option} />
          </li>
        ))}
    </ul>
  );
}

/**
 * Диапазон «от и до»: форма GET без перезагрузки (`next/form`), остальные
 * условия едут скрытыми полями. Страница приводит `ключ.min`/`ключ.max`
 * к каноническому `ключ=от..до`.
 */
export function RangeForm({
  place,
  facet,
}: {
  readonly place: FilterPlace;
  readonly facet: Facet;
}) {
  if (facet.view !== 'range') return null;
  const rest = { ...place.state };
  delete rest[facet.key];
  const hidden = [...new URLSearchParams(placeHref(place, rest).split('?')[1] ?? '')];
  return (
    <Form
      action={place.basePath}
      scroll={false}
      data-part="facet-range"
      className="grid grid-cols-2 gap-2"
    >
      {hidden.map(([name, value]) => (
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
        className="col-span-2 min-h-9 rounded-md border border-border-strong text-sm text-ink transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
      >
        Применить
      </button>
    </Form>
  );
}

/** Галочка: рамка видна в обеих темах, выбранная - залита акцентом. */
export function Check({ on }: { readonly on: boolean }) {
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

const rangeInput =
  'w-full rounded-md border border-border-strong bg-bg px-2.5 py-2 tabular-nums text-ink outline-none placeholder:text-muted focus:border-accent';
