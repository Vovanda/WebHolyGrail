'use client';

import { formatMoney, MAX_QUANTITY, offerViewOf, type OfferView } from 'contracts';
import { useState } from 'react';

import { cart } from '@/lib/shop/cart';
import { OFFER_SNAPSHOTS, writeSnapshots } from '@/lib/shop/snapshots';

import { QuantityStepper } from './QuantityStepper';
import { primaryButton } from './ui';

/**
 * Выпадающий список найденных позиций с количеством и «Добавить».
 *
 * @remarks
 * Стоит под любым полем поиска: в корзине и над выдачей каталога. Добавленная
 * позиция кладётся в корзину сверх того, что там уже есть, и её карточка
 * запоминается снимком - строка корзины появляется сразу. Что делать после
 * добавления - закрыть список или оставить, - решает поле (`onAdded`).
 *
 * Части: `offer-search-results` - список, `offer-search-item` - строка,
 * `offer-search-all` - ссылка на всю выдачу.
 */
export function OfferSuggestions({
  id,
  found,
  allHref,
  onAdded,
}: {
  readonly id: string;
  readonly found: readonly OfferView[];
  /** Вся выдача по запросу; пусто - ссылки нет. */
  readonly allHref?: string | undefined;
  readonly onAdded?: (offer: OfferView) => void;
}) {
  const [quantity, setQuantity] = useState<Record<number, number>>({});
  const [added, setAdded] = useState<number | null>(null);

  const add = (offer: OfferView) => {
    writeSnapshots(OFFER_SNAPSHOTS, { [String(offer.id)]: offerViewOf(offer) });
    cart.add(offer.id, quantity[offer.id] ?? 1);
    setQuantity((q) => ({ ...q, [offer.id]: 1 }));
    setAdded(offer.id);
    onAdded?.(offer);
  };

  return (
    <ul
      id={id}
      data-part="offer-search-results"
      className="absolute inset-x-0 top-full z-20 mt-1 max-h-[28rem] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
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
                {o.slug ? (
                  <a href={`/shop/item/${o.slug}`} className="hover:text-accent">
                    {o.title}
                  </a>
                ) : (
                  o.title
                )}
                <span className="block text-sm text-muted tabular-nums">
                  {o.price ? formatMoney(o.price) : ''}
                  {gone ? ' · нет в наличии' : ''}
                </span>
              </span>
              {!gone && o.price && (
                <>
                  <QuantityStepper
                    value={quantity[o.id] ?? 1}
                    max={stock ?? MAX_QUANTITY}
                    title={o.title}
                    onChange={(next) => setQuantity((q) => ({ ...q, [o.id]: Math.max(1, next) }))}
                  />
                  <button
                    type="button"
                    onClick={() => add(o)}
                    className={`${primaryButton} min-w-28 py-2 text-sm`}
                  >
                    {added === o.id ? 'Добавлено' : 'Добавить'}
                  </button>
                </>
              )}
            </li>
          );
        })
      )}
      {allHref && found.length > 0 && (
        <li>
          <a
            href={allHref}
            data-part="offer-search-all"
            className="block px-3 py-2.5 text-sm font-medium text-accent hover:bg-surface-hover"
          >
            Все результаты
          </a>
        </li>
      )}
    </ul>
  );
}
