import { describe, expect, it } from 'vitest';

import { memoryPorts, memoryState } from './memory-store';
import { placeOrder } from './orders';
import { relatedOffers } from './related';

const offer = (id: number) => ({
  id,
  title: `Позиция ${id}`,
  price: 100_000,
  stock: null,
  howToBuy: 'cart' as const,
  deposit: null,
});
const buyer = { name: 'Анна', phone: '+7 900 000-00-00', email: '', comment: '', consent: true };

describe('ряды страницы позиции', () => {
  it('«часто берут» - из заказов с позицией, чаще вместе - выше', async () => {
    const ports = memoryPorts(memoryState([offer(1), offer(2), offer(3), offer(4)]));
    const order = (ids: number[], h: string) =>
      placeOrder(ports, {
        cart: ids.map((offer) => ({ offer, quantity: 1 })),
        buyer,
        secretHash: h,
      });
    await order([1, 2, 3], 'a');
    await order([1, 3], 'b');
    await order([2, 4], 'c');
    const card = (await ports.offers.cards({ ids: [1] }))[0]!;
    const r = await relatedOffers(ports, card);
    expect(r.together.map((c) => c.id)).toEqual([3, 2]);
    expect(r.similar).toEqual([]);
  });
});
