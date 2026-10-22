import { describe, expect, it } from 'vitest';

import type { StoredInvoice, StoredOrder } from './ports';
import { hashOrderSecret, isOrderSecret, newOrderSecret } from './order-link';
import { toBuyerView } from './view';

const order: StoredOrder = {
  id: 7,
  status: 'accepted',
  lines: [{ offer: 3, title: 'Курс', quantity: 1, price: 100, sum: 100, access: 9 }],
  total: 100,
  buyer: { name: 'Анна', phone: '+7', email: '', comment: '' },
  secretHash: 'секретный хэш',
  createdAt: '2026-10-23T00:00:00Z',
};
const invoice = (o: Partial<StoredInvoice>): StoredInvoice => ({
  id: 1,
  order: 7,
  kind: 'invoice',
  status: 'issued',
  refundOf: null,
  lines: order.lines,
  total: 100,
  dueAt: null,
  codes: [{ line: 0, codeId: 55, code: 'ABCD1234' }],
  ...o,
});

describe('заказ глазами покупателя', () => {
  it('без хэша секрета, номеров кодов и доступа в строках', () => {
    const v = toBuyerView(order, [], new Date());
    expect(JSON.stringify(v)).not.toContain('секретный хэш');
    expect(Object.keys(v.lines[0]!)).toEqual(['offer', 'title', 'quantity', 'price', 'sum']);
  });

  it('черновик не виден, коды - только у оплаченного счёта', () => {
    const v = toBuyerView(
      order,
      [
        invoice({ id: 1, status: 'draft' }),
        invoice({ id: 2, status: 'issued' }),
        invoice({ id: 3, status: 'paid' }),
      ],
      new Date(),
    );
    expect(v.invoices.map((i) => [i.id, i.codes])).toEqual([
      ['2', []],
      ['3', ['ABCD1234']],
    ]);
    expect(JSON.stringify(v)).not.toContain('"codeId"');
  });

  it('просрочка вычисляется на момент запроса', () => {
    const v = toBuyerView(
      order,
      [invoice({ dueAt: '2026-10-01T00:00:00Z' })],
      new Date('2026-10-23T00:00:00Z'),
    );
    expect(v.invoices[0]?.overdue).toBe(true);
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
