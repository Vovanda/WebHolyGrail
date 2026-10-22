'use client';

import { type CartLine, cleanCart, MAX_QUANTITY } from 'contracts';
import { useSyncExternalStore } from 'react';

/**
 * Корзина гостя в браузере (docs/whg/43-shop.md, «Корзина»).
 *
 * @remarks
 * Хранит только номера позиций и количества: названия и цены корзина берёт с
 * сервера, поэтому подменённая здесь цена ни на что не влияет. Хранилище
 * бывает недоступно (приватное окно, запрет сайта) - тогда корзина живёт до
 * перезагрузки страницы, а не ломает её. Вкладки синхронизируются событием
 * `storage`.
 */
const KEY = 'whg-cart';
const listeners = new Set<() => void>();
let memory: CartLine[] = [];
let cached: { raw: string | null; lines: CartLine[] } = { raw: null, lines: [] };

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? cleanCart(value as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function read(): CartLine[] {
  const raw = readRaw();
  if (raw === null) return memory;
  if (raw !== cached.raw) cached = { raw, lines: parseCart(raw) };
  return cached.lines;
}

function write(lines: CartLine[]): void {
  memory = cleanCart(lines);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Хранилище недоступно: корзина остаётся в памяти страницы.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const EMPTY: CartLine[] = [];

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cart = {
  add(offer: number, quantity = 1): void {
    write([...read(), { offer, quantity }]);
  },
  set(offer: number, quantity: number): void {
    const q = Math.min(Math.max(Math.floor(quantity), 0), MAX_QUANTITY);
    write(
      read()
        .map((l) => (l.offer === offer ? { offer, quantity: q } : l))
        .filter((l) => l.quantity > 0),
    );
  },
  remove(offer: number): void {
    write(read().filter((l) => l.offer !== offer));
  },
  clear(): void {
    write([]);
  },
};

/** Ссылки на свои заказы: браузер помнит их, чтобы покупатель вернулся к заказу. */
const ORDERS_KEY = 'whg-orders';

export function rememberOrder(token: string): void {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(ORDERS_KEY) ?? '[]');
    const next = [token, ...(Array.isArray(list) ? list.filter((t) => t !== token) : [])].slice(
      0,
      20,
    );
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  } catch {
    // Не запомнили - ссылка остаётся на странице заказа и в адресной строке.
  }
}
