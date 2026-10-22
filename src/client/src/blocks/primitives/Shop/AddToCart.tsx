'use client';

import { useState } from 'react';

import { cart, useCart } from '@/lib/shop/cart';

import { primaryButton, secondaryButton } from './ui';

/**
 * Кнопка «В корзину» на карточке позиции.
 *
 * @remarks
 * Единственное состояние - лежит ли позиция в корзине. Штучную (остаток 1)
 * второй раз положить нельзя: кнопка становится ссылкой на корзину.
 */
export function AddToCart({
  offer,
  available,
  cartHref = '/cart',
  label = 'В корзину',
}: {
  readonly offer: number;
  /** Сколько можно взять; пусто - без ограничений. */
  readonly available: number | null;
  readonly cartHref?: string;
  /** Надпись на кнопке: «В корзину» или «Оставить заявку» у позиции по заявке. */
  readonly label?: string;
}) {
  const lines = useCart();
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.offer === offer)?.quantity ?? 0;
  const full = available !== null && inCart >= available;

  if (inCart > 0 && (added || full)) {
    return (
      <a data-part="card-action" href={cartHref} className={`${secondaryButton} min-h-11 w-full`}>
        В корзине{inCart > 1 ? ` · ${inCart}` : ''}
      </a>
    );
  }
  return (
    <button
      type="button"
      data-part="card-action"
      className={`${primaryButton} min-h-11 w-full`}
      onClick={() => {
        cart.add(offer);
        setAdded(true);
      }}
    >
      {label}
    </button>
  );
}
