import { type BuyerOrderSummary, MY_ORDERS_PAGE } from 'contracts';

import { hashOrderSecret, isOrderSecret } from './order-link';
import type { ShopPorts } from './ports';
import { toBuyerSummary } from './view';

/**
 * Страница «Моих заказов» по секретам, которые хранит браузер покупателя.
 *
 * @remarks
 * Ответ идёт по порядку секретов. Секрет не того вида или без заказа - `null`
 * на своём месте: браузер его забудет. Секретов сверх страницы не читаем.
 */
export async function myOrders(
  ports: ShopPorts,
  secrets: readonly unknown[],
): Promise<(BuyerOrderSummary | null)[]> {
  return Promise.all(
    secrets.slice(0, MY_ORDERS_PAGE).map(async (secret) => {
      if (!isOrderSecret(secret)) return null;
      const order = await ports.orders.bySecretHash(hashOrderSecret(secret));
      return order ? toBuyerSummary(order, ports.money) : null;
    }),
  );
}
