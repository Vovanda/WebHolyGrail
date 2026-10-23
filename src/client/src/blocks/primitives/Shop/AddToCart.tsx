'use client';

import { MAX_QUANTITY, type OfferView } from 'contracts';
import { useEffect, useState } from 'react';

import { cart, useCart } from '@/lib/shop/cart';
import { OFFER_SNAPSHOTS, writeSnapshots } from '@/lib/shop/snapshots';

import { QuantityStepper } from './QuantityStepper';
import { primaryButton } from './ui';

/**
 * Кнопка «В корзину» на карточке позиции, а после - счётчик количества.
 *
 * @remarks
 * Позиция уже в корзине - карточка показывает счётчик с числом из корзины,
 * в том числе после обновления страницы, и ссылку в корзину. Минус до нуля
 * убирает позицию, и карточка снова предлагает «В корзину». Плюс гаснет на
 * остатке: штучную второй раз не взять.
 *
 * Корзина живёт в браузере, на сервере её нет. Пока она не прочитана, кнопка
 * неактивна: иначе нажатие до чтения положило бы вторую штуку незаметно.
 */
export function AddToCart({
  offer,
  snapshot,
  title,
  available,
  cartHref = '/cart',
  label = 'В корзину',
}: {
  readonly offer: number;
  /** Карточка как её видит покупатель: корзина покажет строку сразу, не дожидаясь сервера. */
  readonly snapshot?: OfferView;
  /** Название позиции - для подписи кнопок счётчика скринридеру; пусто - берётся из снимка. */
  readonly title?: string;
  /** Сколько можно взять; пусто - без ограничений. */
  readonly available: number | null;
  readonly cartHref?: string;
  /** Надпись на кнопке: «В корзину» или «Оставить заявку» у позиции по заявке. */
  readonly label?: string;
}) {
  const lines = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const inCart = lines.find((l) => l.offer === offer)?.quantity ?? 0;

  if (ready && inCart > 0) {
    return (
      <div
        data-part="card-action"
        className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1"
      >
        <QuantityStepper
          value={inCart}
          max={available ?? MAX_QUANTITY}
          title={title ?? snapshot?.title ?? 'позиция'}
          onChange={(next) => cart.set(offer, next)}
        />
        <a
          href={cartHref}
          className="whitespace-nowrap text-sm text-accent underline-offset-2 hover:underline"
        >
          В корзине
        </a>
      </div>
    );
  }
  return (
    <button
      type="button"
      data-part="card-action"
      disabled={!ready}
      className={`${primaryButton} min-h-11 w-full`}
      onClick={() => {
        if (snapshot) writeSnapshots(OFFER_SNAPSHOTS, { [String(offer)]: snapshot });
        cart.add(offer);
      }}
    >
      {label}
    </button>
  );
}
