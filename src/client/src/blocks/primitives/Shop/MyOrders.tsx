'use client';

import { useEffect, useState } from 'react';

import { type BuyerOrderView, formatMoney, ORDER_STATUS_LABELS } from 'contracts';

import { forgetOrder, rememberedOrders } from '@/lib/shop/cart';
import { dropSnapshot, ORDER_SNAPSHOTS, readSnapshots, writeSnapshots } from '@/lib/shop/snapshots';

/**
 * Заказы этого браузера: номер, состояние, дата и итог, у каждого ссылка.
 *
 * @remarks
 * Входа у покупателя нет, и к заказу ведёт только его секретная ссылка. Браузер
 * запоминает ссылки оформленных заказов (`rememberOrder`), и здесь они собраны
 * в одном месте - на случай, если ссылку не сохранили. Клиентский компонент по
 * необходимости (R14): ссылки живут в `localStorage`.
 *
 * Подробности - только у последних заказов: каждый запрос заказа CMS считает
 * в тот же лимит с адреса, что «Я оплатил» и отмену, и двадцать запросов на
 * каждый заход отняли бы у покупателя эти действия. Остальные показываются по
 * снимку, если браузер их уже видел, иначе - просто ссылками. Ссылку, по
 * которой заказа больше нет, браузер забывает вместе со снимком.
 */
const DETAILED = 5;

type Row =
  | { readonly token: string; readonly state: 'shown'; readonly order: BuyerOrderView }
  | { readonly token: string; readonly state: 'link' | 'busy' | 'gone' | 'failed' };

export function MyOrders() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let stopped = false;
    const tokens = rememberedOrders();
    // Сразу - то, что браузер уже видел; сервер обновит строки, когда ответит.
    const seen = readSnapshots<BuyerOrderView>(ORDER_SNAPSHOTS);
    const found: Row[] = tokens.map((token) =>
      seen[token] ? { token, state: 'shown', order: seen[token] } : { token, state: 'link' },
    );
    setRows([...found]);
    // Свежие заказы спрашиваются разом, а не по очереди: ответ приходит за один запрос.
    void Promise.all(
      tokens.slice(0, DETAILED).map(async (token, i) => {
        const response = await fetch('/internal/shop/orders/view', {
          headers: { 'x-order-secret': token },
          cache: 'no-store',
        }).catch(() => null);
        if (response?.status === 404) {
          forgetOrder(token);
          dropSnapshot(ORDER_SNAPSHOTS, token);
        }
        if (response?.ok) {
          const order = (await response.json()) as BuyerOrderView;
          writeSnapshots(ORDER_SNAPSHOTS, { [token]: order });
          found[i] = { token, state: 'shown', order };
        } else if (found[i]?.state !== 'shown' || response?.status === 404) {
          // Снимок остаётся, если сервер просто не ответил: старое лучше пустого.
          found[i] = {
            token,
            state: response?.status === 429 ? 'busy' : response?.status === 404 ? 'gone' : 'failed',
          };
        }
      }),
    ).then(() => {
      if (!stopped) setRows([...found]);
    });
    return () => {
      stopped = true;
    };
  }, []);

  if (rows === null) return <p className="text-muted">Ищем ваши заказы…</p>;
  if (rows.length === 0) {
    return (
      <p data-part="empty" className="text-muted">
        В этом браузере заказов нет. Если заказ оформляли на другом устройстве, откройте его по
        ссылке, которую сохранили после оформления.
      </p>
    );
  }

  return (
    <ul data-part="orders" className="divide-y divide-border border-y border-border">
      {rows.map((row, i) => (
        <li key={row.token} data-part="order">
          <a
            href={`/order/${row.token}`}
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
              <span className={row.state === 'link' ? undefined : 'text-muted'}>
                {row.state === 'busy'
                  ? 'Слишком много запросов - откройте заказ через несколько минут'
                  : row.state === 'gone'
                    ? 'Заказ не найден'
                    : row.state === 'failed'
                      ? 'Заказ не загрузился - откройте его по ссылке'
                      : i === 0
                        ? 'Последний заказ'
                        : 'Более ранний заказ'}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
