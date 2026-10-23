import { describe, expect, it } from 'vitest';

import { moneyPort } from './money';
import type { StoredInvoice, StoredOrder } from './ports';
import { hashOrderSecret, isOrderSecret, newOrderSecret } from './order-link';
import { toBuyerView, toOfferView } from './view';

const order: StoredOrder = {
  id: 7,
  status: 'accepted',
  lines: [
    {
      offer: 3,
      title: 'Курс',
      quantity: 1,
      price: 4_500_500_000,
      sum: 4_500_500_000,
      mode: 'cart',
      deposit: null,
    },
  ],
  total: 4_500_500_000,
  buyer: { name: 'Анна', phone: '+7', email: '', comment: '' },
  secretHash: 'секретный хэш',
  cancelReason: null,
  createdAt: '2026-10-23T00:00:00Z',
};
const invoice = (o: Partial<StoredInvoice>): StoredInvoice => ({
  id: 1,
  order: 7,
  kind: 'invoice',
  purpose: 'payment',
  status: 'issued',
  refundOf: null,
  lines: order.lines,
  extra: [],
  voidReason: null,
  total: 4_500_500_000,
  dueAt: null,
  ...o,
});

const rub = moneyPort();

describe('заказ глазами покупателя', () => {
  it('без хэша секрета, номеров кодов и доступа в строках', () => {
    const v = toBuyerView(order, [], new Date(), rub);
    expect(JSON.stringify(v)).not.toContain('секретный хэш');
    expect(Object.keys(v.lines[0]!)).toEqual([
      'offer',
      'title',
      'quantity',
      'price',
      'sum',
      'mode',
      'deposit',
      'removed',
    ]);
  });

  it('черновик покупатель не видит', () => {
    const v = toBuyerView(
      order,
      [
        invoice({ id: 1, status: 'draft' }),
        invoice({ id: 2, status: 'issued' }),
        invoice({ id: 3, status: 'paid' }),
      ],
      new Date(),
      rub,
    );
    expect(v.invoices.map((i) => i.id)).toEqual(['2', '3']);
  });

  it('просрочка вычисляется на момент запроса', () => {
    const v = toBuyerView(
      order,
      [invoice({ dueAt: '2026-10-01T00:00:00Z' })],
      new Date('2026-10-23T00:00:00Z'),
      rub,
    );
    expect(v.invoices[0]?.overdue).toBe(true);
  });

  it('суммы выходят Money в валюте магазина', () => {
    const v = toBuyerView(order, [invoice({})], new Date(), rub);
    expect(v.total).toEqual({ units: 4500, micros: 500_000, currency: 'RUB' });
    expect(v.lines[0]?.sum).toEqual(v.total);
    expect(v.invoices[0]?.total).toEqual(v.total);
    expect(v.invoices[0]?.purpose).toBe('payment');
  });

  it('курс берётся на дату оформления: смена курса после заказа сумм не меняет', () => {
    const usd = (from: string, to: string | null, rub: number) => ({
      currency: 'USD' as const,
      microsPerUnit: rub * 1_000_000,
      from,
      to,
    });
    const rates = [
      usd('2026-01-01T00:00:00Z', '2026-11-01T00:00:00Z', 90),
      usd('2026-11-01T00:00:00Z', null, 100),
    ];
    const v = toBuyerView(order, [], new Date('2026-12-01T00:00:00Z'), moneyPort('USD', rates));
    expect(v.total).toEqual({ units: 50, micros: 5_555, currency: 'USD' });
  });
});

describe('секрет ссылки заказа', () => {
  it('22 знака base64url, хэш детерминирован, разные секреты разные', () => {
    const a = newOrderSecret();
    const b = newOrderSecret();
    expect(isOrderSecret(a.token)).toBe(true);
    expect(a.hash).toBe(hashOrderSecret(a.token));
    expect(a.token).not.toBe(b.token);
    expect(isOrderSecret('../../etc')).toBe(false);
  });
});

describe('позиция глазами покупателя', () => {
  const card = (price: number | null) => ({
    id: 1,
    title: 'Позиция',
    price,
    stock: null,
    summary: null,
    image: null,
    howToBuy: 'cart' as const,
    deposit: null,
    slug: null,
    section: null,
    specs: {},
    listPrice: null,
  });

  it('нулевая и пустая цена - по запросу, иначе Money', () => {
    const now = new Date();
    expect(toOfferView(card(0), moneyPort(), now).price).toBeNull();
    expect(toOfferView(card(null), moneyPort(), now).price).toBeNull();
    expect(toOfferView(card(1_000_000), moneyPort(), now).price?.units).toBe(1);
  });
});
