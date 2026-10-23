'use client';

import { CATALOG_HREF } from 'contracts';
import Form from 'next/form';
import { useEffect, useRef, useState } from 'react';

import { useOfferSuggest } from '@/lib/shop/use-offer-suggest';

import { OfferSuggestions } from './OfferSuggestions';

/** Строка на странице одна - id постоянный: useId расходился между сервером и браузером. */
const LIST_ID = 'shop-search-results';

/**
 * Строка поиска магазина - вверху каждой его страницы (docs/whg/43-shop.md,
 * «Вид страниц магазина»).
 *
 * @remarks
 * Enter ведёт в выдачу (`next/form`, без перезагрузки; без JS - обычная форма).
 * При наборе выпадают подсказки с количеством и «Добавить»: после добавления
 * список остаётся открытым - покупатель набирает заказ подряд. В разделе у
 * строки пометка «в разделе …»: снял её - ищешь по всему магазину.
 *
 * Части: `shop-search`, `shop-search-scope`, `offer-search-results`.
 */
export function ShopSearchBar({
  query = '',
  scope,
}: {
  readonly query?: string;
  /** Раздел, внутри которого искать по умолчанию; пусто - весь магазин. */
  readonly scope?: { readonly slug: string; readonly title: string } | undefined;
}) {
  const [text, setText] = useState(query);
  const [inSection, setInSection] = useState(Boolean(scope));
  const [open, setOpen] = useState(false);
  const found = useOfferSuggest(open ? text : '');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setText(query), [query]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const action = inSection && scope ? `${CATALOG_HREF}/${scope.slug}` : CATALOG_HREF;
  const all = text.trim() ? `${action}?q=${encodeURIComponent(text.trim())}` : undefined;

  return (
    <div ref={box} data-part="shop-search" className="relative">
      <Form action={action} role="search" className="relative" onSubmit={() => setOpen(false)}>
        <input
          type="search"
          name="q"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={
            inSection && scope ? `Поиск в разделе «${scope.title}»` : 'Поиск по магазину'
          }
          aria-label="Поиск по магазину"
          aria-controls={LIST_ID}
          aria-expanded={open && found !== null}
          autoComplete="off"
          className={`min-h-12 w-full rounded-lg border border-border-strong bg-bg pr-28 text-ink outline-none placeholder:text-muted focus:border-accent ${
            inSection && scope ? 'pl-4 md:pl-48' : 'pl-4'
          }`}
        />
        {inSection && scope && (
          <button
            type="button"
            data-part="shop-search-scope"
            onClick={() => setInSection(false)}
            aria-label={`Искать не только в разделе «${scope.title}»`}
            className="absolute inset-y-2 left-2 hidden max-w-44 items-center gap-1 truncate rounded-md bg-accent-soft px-2 text-xs text-ink md:inline-flex"
          >
            <span className="truncate">в разделе {scope.title}</span>
            <span aria-hidden="true" className="text-muted">
              ×
            </span>
          </button>
        )}
        <button
          type="submit"
          className="absolute inset-y-1.5 right-1.5 rounded-md bg-accent px-5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Найти
        </button>
      </Form>
      {open && found !== null && <OfferSuggestions id={LIST_ID} found={found} allHref={all} />}
    </div>
  );
}
