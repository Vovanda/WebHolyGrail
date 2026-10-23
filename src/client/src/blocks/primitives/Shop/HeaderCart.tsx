'use client';

import { Package, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

import { rememberedOrders, useCart } from '@/lib/shop/cart';

/**
 * Корзина и заказы покупателя в шапке: значок со счётчиком и вход в «Мои заказы».
 *
 * @remarks
 * Client-компонент по необходимости (R14): корзина и ссылки на заказы живут
 * в браузере. На сервере и до первой отрисовки в браузере здесь пусто - так
 * разметка сервера совпадает с клиентской, а значки появляются сразу после.
 *
 * Значок корзины показывается, когда в ней что-то лежит: с пустой корзиной
 * идти некуда. Счётчик - число штук, как у Озона. «Мои заказы» - когда браузер
 * помнит хотя бы один заказ.
 */
export function HeaderCart({ cartHref }: { readonly cartHref: string }) {
  const lines = useCart();
  const [hasOrders, setHasOrders] = useState(false);

  useEffect(() => {
    setHasOrders(rememberedOrders().length > 0);
  }, [lines]);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <>
      {hasOrders && (
        <a href="/orders" data-part="orders" aria-label="Мои заказы" className="icon-button">
          <Package size={18} />
        </a>
      )}
      {count > 0 && (
        <a
          href={cartHref}
          data-part="cart"
          aria-label={`Корзина, ${count} шт.`}
          className="icon-button relative"
        >
          <ShoppingCart size={18} />
          <span
            data-part="count"
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none text-accent-fg tabular-nums"
          >
            {count > 99 ? '99+' : count}
          </span>
        </a>
      )}
    </>
  );
}
