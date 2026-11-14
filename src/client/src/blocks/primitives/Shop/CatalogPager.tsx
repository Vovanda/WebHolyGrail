import Link from 'next/link';

import { type FilterPlace, placeHref } from './facet-parts';

/**
 * Низ выдачи: «Показать ещё» и номера страниц.
 *
 * @remarks
 * «Показать ещё» дописывает следующую страницу под текущей: ссылка на `?upto=N`,
 * сервер отдаёт страницы с первой по N, переход без перезагрузки и без прокрутки.
 * Номера ведут на отдельные адреса `?page=N` - по ним поисковик проходит весь
 * раздел. Части: `pager`, `pager-more`, `pager-page`.
 */
export function CatalogPager({
  place,
  page,
  pages,
  shown,
  total,
}: {
  readonly place: FilterPlace;
  readonly page: number;
  readonly pages: number;
  /** Сколько позиций уже на экране. */
  readonly shown: number;
  readonly total: number;
}) {
  if (pages <= 1) return null;
  const base = placeHref(place, place.state);
  const withParam = (name: string, value: number) =>
    `${base}${base.includes('?') ? '&' : '?'}${name}=${value}`;
  const left = total - shown;
  return (
    <nav
      data-part="pager"
      aria-label="Страницы выдачи"
      className="mt-8 grid justify-items-center gap-4"
    >
      {left > 0 && page < pages && (
        <Link
          href={withParam('upto', page + 1)}
          scroll={false}
          data-part="pager-more"
          className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-6 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          Показать ещё {Math.min(left, 30)}
        </Link>
      )}
      <ul className="flex flex-wrap justify-center gap-1">
        {pageWindow(page, pages).map((n, at) =>
          n === null ? (
            <li
              key={`gap-${at}`}
              aria-hidden="true"
              className="inline-flex size-9 items-center justify-center text-muted"
            >
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={n === 1 ? base : withParam('page', n)}
                data-part="pager-page"
                aria-current={n === page ? 'page' : undefined}
                className={`inline-flex size-9 items-center justify-center rounded-md text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  n === page ? 'bg-accent text-accent-fg' : 'text-ink hover:bg-surface-hover'
                }`}
              >
                {n}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

/** Номера на виду: первая, две по сторонам от текущей, последняя; пропуски - многоточием. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2]);
  const out: (number | null)[] = [];
  for (let n = 1; n <= pages; n += 1) {
    if (!keep.has(n)) continue;
    const last = out[out.length - 1];
    if (typeof last === 'number' && n - last > 1) out.push(null);
    out.push(n);
  }
  return out;
}
