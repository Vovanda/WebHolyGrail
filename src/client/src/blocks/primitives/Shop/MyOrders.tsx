'use client';

import { useCallback, useEffect, useState } from 'react';

import { type BuyerOrderSummary, formatMoney, ORDER_STATUS_LABELS } from 'contracts';

import { forgetOrder, rememberedOrders } from '@/lib/shop/cart';
import { dropSnapshot, ORDER_SNAPSHOTS, readSnapshots, writeSnapshots } from '@/lib/shop/snapshots';

import { Pagination } from '../Blog/Pagination';

/**
 * Заказы этого браузера: номер, состояние, дата и итог, у каждого ссылка.
 *
 * @remarks
 * Входа у покупателя нет, и к заказу ведёт только его секретная ссылка. Браузер
 * запоминает ссылки оформленных заказов (`rememberOrder`), и здесь они собраны
 * в одном месте - на случай, если ссылку не сохранили. Клиентский компонент по
 * необходимости (R14): ссылки живут в `localStorage`.
 *
 * Список идёт страницами по десять заказов с номерами, номер страницы - в адресе
 * (`?page=`), номер сверх последней показывает последнюю. Страница спрашивается одним запросом: лимит частоты CMS считает запрос, а не
 * заказ, и длинный список не отнимает у покупателя «Я оплатил» и отмену.
 * Заказы, которые браузер уже видел, показываются по снимку сразу, сервер их
 * обновляет. Ссылку, по которой заказа больше нет, браузер забывает.
 */
const PAGE = 10;

type Row =
  | { readonly token: string; readonly state: 'shown'; readonly order: BuyerOrderSummary }
  | { readonly token: string; readonly state: 'loading' | 'busy' | 'gone' | 'failed' };

export function MyOrders({ page = 1 }: { readonly page?: number }) {
  const [tokens, setTokens] = useState<string[] | null>(null);
  const [rows, setRows] = useState<Map<string, Row>>(new Map());

  const load = useCallback(async (page: readonly string[]) => {
    const seen = readSnapshots<BuyerOrderSummary>(ORDER_SNAPSHOTS);
    setRows((current) => {
      const next = new Map(current);
      for (const token of page) {
        const snap = seen[token];
        next.set(
          token,
          snap ? { token, state: 'shown', order: snap } : { token, state: 'loading' },
        );
      }
      return next;
    });
    const response = await fetch('/internal/shop/orders/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secrets: page }),
      cache: 'no-store',
    }).catch(() => null);
    const views = response?.ok
      ? ((await response.json()) as { views: (BuyerOrderSummary | null)[] }).views
      : null;
    setRows((current) => {
      const next = new Map(current);
      page.forEach((token, i) => {
        const view = views?.[i];
        if (view) {
          writeSnapshots(ORDER_SNAPSHOTS, { [token]: view });
          next.set(token, { token, state: 'shown', order: view });
        } else if (views && view === null) {
          forgetOrder(token);
          dropSnapshot(ORDER_SNAPSHOTS, token);
          next.set(token, { token, state: 'gone' });
        } else if (next.get(token)?.state !== 'shown') {
          // Сервер не ответил: снимок, если он был, остаётся - старое лучше пустого.
          next.set(token, { token, state: response?.status === 429 ? 'busy' : 'failed' });
        }
      });
      return next;
    });
  }, []);

  const pages = tokens ? Math.max(1, Math.ceil(tokens.length / PAGE)) : 1;
  const current = Math.min(Math.max(1, Math.floor(page)), pages);

  useEffect(() => setTokens(rememberedOrders()), []);
  useEffect(() => {
    if (tokens?.length) void load(tokens.slice((current - 1) * PAGE, current * PAGE));
  }, [tokens, current, load]);

  if (tokens === null) return <p className="text-muted">Ищем ваши заказы…</p>;
  if (tokens.length === 0) {
    return (
      <p data-part="empty" className="text-muted">
        В этом браузере заказов нет. Если заказ оформляли на другом устройстве, откройте его по
        ссылке, которую сохранили после оформления.
      </p>
    );
  }

  return (
    <>
      <ul data-part="orders" className="divide-y divide-border border-y border-border">
        {tokens.slice((current - 1) * PAGE, current * PAGE).map((token) => {
          const row = rows.get(token) ?? { token, state: 'loading' as const };
          return (
            <li key={token} data-part="order">
              <a
                href={`/order/${token}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-ink hover:text-accent"
              >
                {row.state === 'shown' ? (
                  <>
                    <span className="font-medium">Заказ № {row.order.id}</span>
                    <span className="text-sm text-muted">
                      {ORDER_STATUS_LABELS[row.order.status]},{' '}
                      {new Date(row.order.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="tabular-nums">{formatMoney(row.order.total)}</span>
                  </>
                ) : (
                  <span className="text-muted">
                    {row.state === 'loading'
                      ? 'Загружаем заказ…'
                      : row.state === 'busy'
                        ? 'Слишком много запросов - откройте заказ через несколько минут'
                        : row.state === 'gone'
                          ? 'Заказ не найден'
                          : 'Заказ не загрузился - откройте его по ссылке'}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
      <Pagination
        currentPage={current}
        totalPages={pages}
        hrefBuilder={(p) => (p === 1 ? '?' : `?page=${p}`)}
        className="mt-6"
      />
    </>
  );
}
