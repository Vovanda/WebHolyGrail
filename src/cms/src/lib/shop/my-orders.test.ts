import { beforeEach, describe, expect, it } from 'vitest';

import { memoryPorts, memoryState } from './memory-store';
import { MY_ORDERS_PAGE, myOrders } from './my-orders';
import { newOrderSecret } from './order-link';
import { placeOrder } from './orders';
import type { ShopPorts } from './ports';

const buyer = { name: 'Анна', phone: '+7 900 000-00-00', email: '', comment: '', consent: true };

let ports: ShopPorts;

beforeEach(() => {
  ports = memoryPorts(
    memoryState([
      {
        id: 1,
        title: 'Корм 15 кг',
        price: 450_000_000,
        stock: null,
        howToBuy: 'cart',
        deposit: null,
      },
    ]),
  );
});

async function placed(): Promise<string> {
  const secret = newOrderSecret();
  const r = await placeOrder(ports, {
    cart: [{ offer: 1, quantity: 2 }],
    buyer,
    secretHash: secret.hash,
  });
  if (!r.ok) throw new Error(r.error);
  return secret.token;
}

describe('«Мои заказы»', () => {
  it('сводка по порядку секретов, неизвестный и кривой - null на своём месте', async () => {
    const first = await placed();
    const unknown = newOrderSecret().token;
    const views = await myOrders(ports, [first, unknown, 'не секрет', 42]);
    expect(views).toHaveLength(4);
    expect(views.slice(1)).toEqual([null, null, null]);
    expect(views[0]).toMatchObject({
      status: 'new',
      total: { units: 900, micros: 0, currency: 'RUB' },
    });
    expect(Object.keys(views[0]!).sort()).toEqual(['createdAt', 'id', 'status', 'total']);
  });

  it('секретов сверх страницы не читает', async () => {
    const token = await placed();
    const views = await myOrders(
      ports,
      Array.from({ length: MY_ORDERS_PAGE + 5 }, () => token),
    );
    expect(views).toHaveLength(MY_ORDERS_PAGE);
  });
});
