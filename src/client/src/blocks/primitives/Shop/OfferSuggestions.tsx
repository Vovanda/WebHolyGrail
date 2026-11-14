'use client';

import { formatMoney, MAX_QUANTITY, type MediaRef, type OfferView } from 'contracts';
import { useState } from 'react';

import { MediaImage } from '@/blocks/primitives/Media';
import { addOffer } from '@/lib/shop/add-offer';

import { QuantityStepper } from './QuantityStepper';

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
    addOffer(offer, quantity[offer.id] ?? 1);
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
              className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
            >
              <span
                data-part="offer-search-media"
                className="size-10 shrink-0 overflow-hidden rounded-md bg-surface-hover"
              >
                {typeof o.image === 'object' && o.image && (
                  <MediaImage
                    media={o.image as MediaRef}
                    place="40px"
                    alt=""
                    zoom={false}
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                {o.slug ? (
                  <a
                    href={`/shop/item/${o.slug}`}
                    className="line-clamp-1 text-sm text-ink hover:text-accent"
                  >
                    {o.title}
                  </a>
                ) : (
                  <span className="line-clamp-1 text-sm text-ink">{o.title}</span>
                )}
                <span className="block text-sm font-semibold tabular-nums text-ink">
                  {o.price ? formatMoney(o.price) : ''}
                  {gone && <span className="ml-2 font-normal text-muted">нет в наличии</span>}
                </span>
              </span>
              {!gone && o.price && (
                <span className="flex shrink-0 items-center gap-2">
                  <span className="hidden sm:block">
                    <QuantityStepper
                      value={quantity[o.id] ?? 1}
                      max={stock ?? MAX_QUANTITY}
                      title={o.title}
                      onChange={(next) => setQuantity((q) => ({ ...q, [o.id]: Math.max(1, next) }))}
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => add(o)}
                    className={`min-h-9 min-w-24 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                      added === o.id
                        ? 'border-success text-success'
                        : 'border-border-strong text-ink hover:border-accent hover:text-accent'
                    }`}
                  >
                    {added === o.id ? 'Добавлено' : 'Добавить'}
                  </button>
                </span>
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
