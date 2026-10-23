'use client';

import { formatMoney, MAX_QUANTITY, offerViewOf, type OfferView } from 'contracts';
import { useEffect, useId, useState } from 'react';

import { cart } from '@/lib/shop/cart';
import { OFFER_SNAPSHOTS, writeSnapshots } from '@/lib/shop/snapshots';

import { QuantityStepper } from './QuantityStepper';
import { field, primaryButton } from './ui';

/** С какой длины запроса искать и сколько ждать паузы в наборе. */
const MIN_QUERY = 2;
const PAUSE_MS = 300;

/**
 * Поиск позиций с добавлением прямо из корзины.
 *
 * @remarks
 * Части: поле запроса, список найденного, у каждой строки - счётчик количества
 * и «Добавить». Ищет сервер тем же поиском, что раздел каталога: опечатки и
 * набор в другой раскладке находят позицию. Клиентский компонент по
 * необходимости (R14): набор и список живут в браузере.
 *
 * Добавленная позиция кладётся в корзину сверх того, что там уже есть, и её
 * карточка запоминается снимком - строка корзины появляется сразу.
 */
export function OfferSearch({ label = 'Добавить в заказ' }: { readonly label?: string }) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<OfferView[] | null>(null);
  const [quantity, setQuantity] = useState<Record<number, number>>({});
  const listId = useId();

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) return setFound(null);
    const stop = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/internal/shop/offers?q=${encodeURIComponent(q)}`, { signal: stop.signal })
        .then((r) => (r.ok ? r.json() : { docs: [] }))
        .then((d: { docs: OfferView[] }) => setFound(d.docs))
        .catch(() => undefined);
    }, PAUSE_MS);
    return () => {
      clearTimeout(timer);
      stop.abort();
    };
  }, [query]);

  const add = (offer: OfferView) => {
    writeSnapshots(OFFER_SNAPSHOTS, { [String(offer.id)]: offerViewOf(offer) });
    cart.add(offer.id, quantity[offer.id] ?? 1);
    setQuery('');
    setQuantity({});
  };

  return (
    <div data-part="offer-search" className="relative">
      <label className="grid gap-1.5 text-sm text-muted">
        {label}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название позиции"
          autoComplete="off"
          aria-controls={listId}
          aria-expanded={found !== null}
          className={field}
        />
      </label>
      {found !== null && (
        <ul
          id={listId}
          data-part="offer-search-results"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-surface shadow-lg"
        >
          {found.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted">Ничего не нашлось</li>
          ) : (
            found.map((o) => {
              const stock = typeof o.stock === 'number' ? o.stock : null;
              const gone = stock !== null && stock <= 0;
              return (
                <li
                  key={o.id}
                  data-part="offer-search-item"
                  className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
                >
                  <span className="w-full min-w-0 text-ink sm:w-auto sm:flex-1">
                    {o.title}
                    <span className="block text-sm text-muted tabular-nums">
                      {o.price ? formatMoney(o.price) : ''}
                      {gone ? ' · нет в наличии' : ''}
                    </span>
                  </span>
                  {!gone && (
                    <>
                      <QuantityStepper
                        value={quantity[o.id] ?? 1}
                        max={stock ?? MAX_QUANTITY}
                        title={o.title}
                        onChange={(next) =>
                          setQuantity((q) => ({ ...q, [o.id]: Math.max(1, next) }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => add(o)}
                        className={`${primaryButton} py-2`}
                      >
                        Добавить
                      </button>
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
