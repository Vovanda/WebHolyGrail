import { type OfferSnapshot, shopSettings } from 'contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  changeInvoice,
  createInvoice,
  createRefund,
  deleteDraft,
  reportBySecret,
  updateDraft,
} from './invoices';
import { memoryPorts, memoryState, type MemoryState } from './memory-store';
import { cancelBySecret, cancelStaleOrders, changeOrder, placeOrder } from './orders';
import type { ShopPorts, StoredOrder } from './ports';

/**
 * Сценарии магазина на портах в памяти: путь продажи целиком и каждый отказ.
 * Автомат проверен перебором в contracts; здесь - что сценарии зовут его и
 * трогают остаток, счета и коды как сказано в docs/whg/43-shop.md.
 */

const PUPPY: OfferSnapshot = {
  id: 1,
  title: 'Щенок Бим',
  price: 5_000_000,
  stock: 1,
  access: null,
  howToBuy: 'cart',
  deposit: null,
};
const FOOD: OfferSnapshot = {
  id: 2,
  title: 'Корм 15 кг',
  price: 450_000,
  stock: null,
  access: null,
  howToBuy: 'cart',
  deposit: null,
};
const COURSE: OfferSnapshot = {
  id: 3,
  title: 'Курс «Сила»',
  price: 990_000,
  stock: null,
  access: 77,
  howToBuy: 'cart',
  deposit: null,
};
const COURSE_WITH_DEPOSIT: OfferSnapshot = {
  id: 5,
  title: 'Курс с бронью',
  price: 60_000,
  stock: null,
  access: 78,
  howToBuy: 'cart',
  deposit: 10_000,
};
const PUPPY_BY_REQUEST: OfferSnapshot = {
  id: 4,
  title: 'Щенок Рада',
  price: 6_000_000,
  stock: 1,
  access: null,
  howToBuy: 'request',
  deposit: null,
};
const buyer = { name: 'Анна', phone: '+7 900 000-00-00', email: '', comment: '', consent: true };

let state: MemoryState;
let ports: ShopPorts;

beforeEach(() => {
  state = memoryState([PUPPY, FOOD, COURSE, PUPPY_BY_REQUEST, COURSE_WITH_DEPOSIT]);
  ports = memoryPorts(state);
});

async function order(cart = [{ offer: 1, quantity: 1 }], secretHash = 'h1'): Promise<StoredOrder> {
  const r = await placeOrder(ports, { cart, buyer, secretHash });
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

async function paidInvoice(o: StoredOrder) {
  await changeOrder(ports, o.id, 'accept', 'manager');
  const inv = await createInvoice(ports, o.id);
  if (!inv.ok) throw new Error(inv.error);
  await changeInvoice(ports, inv.value.id, 'issue', 'manager');
  const paid = await changeInvoice(ports, inv.value.id, 'confirm', 'manager');
  if (!paid.ok) throw new Error(paid.error);
  return paid.value;
}

describe('оформление', () => {
  it('цена из базы, остаток штучной позиции списан', async () => {
    const o = await order([{ offer: 1, quantity: 1 }]);
    expect(o.total).toBe(5_000_000);
    expect(o.status).toBe('new');
    expect(state.offers.get(1)?.stock).toBe(0);
  });

  it('второго покупателя того же щенка не пускает, ничего не меняя', async () => {
    await order();
    const second = await placeOrder(ports, {
      cart: [{ offer: 1, quantity: 1 }],
      buyer,
      secretHash: 'h2',
    });
    expect(second).toEqual({ ok: false, error: 'shortage', detail: [{ offer: 1, available: 0 }] });
    expect(state.orders.size).toBe(1);
  });

  it('плохая анкета - ошибки по полям, остаток не тронут', async () => {
    const r = await placeOrder(ports, {
      cart: [{ offer: 1, quantity: 1 }],
      buyer: { name: '' },
      secretHash: 'h',
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toBe('invalid');
    expect(state.offers.get(1)?.stock).toBe(1);
  });

  it('пустая корзина - отказ', async () => {
    expect(await placeOrder(ports, { cart: [], buyer, secretHash: 'h' })).toEqual({
      ok: false,
      error: 'empty',
    });
  });
});

describe('заявка', () => {
  it('не держит остаток: щенка по заявке оформляют двое, принимается один', async () => {
    const first = await order([{ offer: 4, quantity: 1 }], 'r1');
    const second = await order([{ offer: 4, quantity: 1 }], 'r2');
    expect(state.offers.get(4)?.stock).toBe(1);

    expect((await changeOrder(ports, first.id, 'accept', 'manager')).ok).toBe(true);
    expect(state.offers.get(4)?.stock).toBe(0);

    const refused = await changeOrder(ports, second.id, 'accept', 'manager');
    expect(refused).toEqual({ ok: false, error: 'shortage', detail: [{ offer: 4, available: 0 }] });
    expect((await ports.orders.get(second.id))?.status).toBe('new');
  });

  it('отмена новой заявки остатка не трогает, принятой - возвращает', async () => {
    const o = await order([{ offer: 4, quantity: 1 }], 'r3');
    await changeOrder(ports, o.id, 'cancel', 'manager');
    expect(state.offers.get(4)?.stock).toBe(1);

    const p = await order([{ offer: 4, quantity: 1 }], 'r4');
    await changeOrder(ports, p.id, 'accept', 'manager');
    await changeOrder(ports, p.id, 'cancel', 'manager');
    expect(state.offers.get(4)?.stock).toBe(1);
  });

  it('заказ из корзины и заявки: корзина списана сразу, заявка - при принятии', async () => {
    const o = await order(
      [
        { offer: 1, quantity: 1 },
        { offer: 4, quantity: 1 },
      ],
      'r5',
    );
    expect([state.offers.get(1)?.stock, state.offers.get(4)?.stock]).toEqual([0, 1]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect([state.offers.get(1)?.stock, state.offers.get(4)?.stock]).toEqual([0, 0]);
  });
});

describe('отмена заказа', () => {
  it('покупатель отменяет новый по ссылке - щенок снова в витрине', async () => {
    await order();
    expect((await cancelBySecret(ports, 'h1')).ok).toBe(true);
    expect(state.offers.get(1)?.stock).toBe(1);
  });

  it('чужая ссылка не находит заказ', async () => {
    await order();
    expect(await cancelBySecret(ports, 'чужая')).toEqual({ ok: false, error: 'not_found' });
  });

  it('принятый покупатель не отменяет', async () => {
    const o = await order();
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect(await cancelBySecret(ports, 'h1')).toEqual({ ok: false, error: 'forbidden' });
  });

  it('система отменяет новые старше 72 часов и не трогает принятые', async () => {
    const stale = await order([{ offer: 1, quantity: 1 }], 'a');
    const accepted = await order([{ offer: 2, quantity: 1 }], 'b');
    await changeOrder(ports, accepted.id, 'accept', 'manager');
    state.now = new Date(state.now.getTime() + 73 * 3_600_000);
    expect(await cancelStaleOrders(ports)).toBe(1);
    expect(state.orders.get(String(stale.id))?.status).toBe('cancelled');
    expect(state.orders.get(String(accepted.id))?.status).toBe('accepted');
    expect(state.offers.get(1)?.stock).toBe(1);
  });

  it('заказ, отменённый другим процессом, второй раз остаток не возвращает', async () => {
    const o = await order([{ offer: 1, quantity: 1 }], 'race');
    // Другой процесс уже отменил заказ, а этот прочитал его ещё новым.
    const stale = { ...ports, orders: { ...ports.orders, get: async () => o } };
    state.orders.set(String(o.id), { ...o, status: 'cancelled' });
    state.offers.set(1, { ...PUPPY, stock: 1 });
    const r = await changeOrder(stale, o.id, 'cancel', 'system');
    expect(r).toEqual({ ok: false, error: 'forbidden' });
    expect(state.offers.get(1)?.stock).toBe(1);
  });

  it('срок брони заказа - из настроек магазина', async () => {
    state.settings = shopSettings({ orderHoldHours: 24 });
    const o = await order([{ offer: 1, quantity: 1 }], 's24');
    state.now = new Date(state.now.getTime() + 25 * 3_600_000);
    expect(await cancelStaleOrders(ports)).toBe(1);
    expect(state.orders.get(String(o.id))?.status).toBe('cancelled');
  });

  it('с оплаченным счётом отмена отказывает, пока деньги не вернули', async () => {
    const o = await order();
    const paid = await paidInvoice(o);
    expect(await changeOrder(ports, o.id, 'cancel', 'manager')).toEqual({
      ok: false,
      error: 'money_held',
    });
    const refund = await createRefund(ports, paid.id);
    if (!refund.ok) throw new Error(refund.error);
    await changeInvoice(ports, refund.value.id, 'issue', 'manager');
    await changeInvoice(ports, refund.value.id, 'confirm', 'manager');
    expect((await changeOrder(ports, o.id, 'cancel', 'manager')).ok).toBe(true);
    expect(state.offers.get(1)?.stock).toBe(1);
  });

  it('открытые счета аннулируются, черновики удаляются', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'c1');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const a = await createInvoice(ports, o.id);
    const b = await createInvoice(ports, o.id, { purpose: 'deposit' });
    if (!a.ok || !b.ok) throw new Error('счёт');
    await changeInvoice(ports, a.value.id, 'issue', 'manager');
    await changeOrder(ports, o.id, 'cancel', 'manager');
    expect(state.invoices.get(String(a.value.id))?.status).toBe('voided');
    expect(state.invoices.has(String(b.value.id))).toBe(false);
  });
});

describe('счёт', () => {
  it('к новому заказу счёт не выставляется', async () => {
    const o = await order();
    expect(await createInvoice(ports, o.id)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('мембраны: цена правится, доставка своей строкой, количество закреплено', async () => {
    const o = await order([{ offer: 2, quantity: 3 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const lines = [
      { offer: 2, title: 'Корм 15 кг', quantity: 3, price: 470_000 },
      { offer: null, title: 'Доставка', quantity: 1, price: 150_000 },
    ];
    const inv = await createInvoice(ports, o.id, { lines, dueAt: '2026-10-30T00:00:00Z' });
    expect(inv.ok && inv.value.total).toBe(3 * 470_000 + 150_000);
    if (!inv.ok) throw new Error(inv.error);
    const more = await updateDraft(ports, inv.value.id, { lines: [{ ...lines[0]!, quantity: 4 }] });
    expect(more).toEqual({ ok: false, error: 'quantity_locked', detail: { offer: 2 } });
  });

  it('второй живой основной счёт - отказ: иначе вторые коды за ту же покупку', async () => {
    const o = await order([{ offer: 3, quantity: 1 }], 'p2');
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect((await createInvoice(ports, o.id)).ok).toBe(true);
    expect(await createInvoice(ports, o.id)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('позиция не из заказа в счёт не попадает', async () => {
    const o = await order([{ offer: 2, quantity: 1 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const r = await createInvoice(ports, o.id, {
      lines: [{ offer: 1, title: 'Щенок', quantity: 1, price: 1 }],
    });
    expect(r).toEqual({ ok: false, error: 'invalid' });
  });

  it('одна позиция дважды в счёте - отказ: иначе двойная сумма и два кода за одну покупку', async () => {
    const o = await order([{ offer: 3, quantity: 1 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const line = { offer: 3, title: 'Курс', quantity: 1, price: 990_000 };
    expect(await createInvoice(ports, o.id, { lines: [line, line] })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('черновик правится и удаляется, выставленный - нет', async () => {
    const o = await order([{ offer: 2, quantity: 1 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    if (!inv.ok) throw new Error(inv.error);
    expect((await updateDraft(ports, inv.value.id, { dueAt: '2026-11-01T00:00:00Z' })).ok).toBe(
      true,
    );
    await changeInvoice(ports, inv.value.id, 'issue', 'manager');
    expect((await updateDraft(ports, inv.value.id, {})).ok).toBe(false);
    expect(await deleteDraft(ports, inv.value.id)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('покупатель заявляет оплату только по счёту своего заказа', async () => {
    const mine = await order([{ offer: 2, quantity: 1 }], 'mine');
    const other = await order([{ offer: 2, quantity: 1 }], 'other');
    await changeOrder(ports, mine.id, 'accept', 'manager');
    await changeOrder(ports, other.id, 'accept', 'manager');
    const inv = await createInvoice(ports, other.id);
    if (!inv.ok) throw new Error(inv.error);
    await changeInvoice(ports, inv.value.id, 'issue', 'manager');
    expect(await reportBySecret(ports, 'mine', inv.value.id)).toEqual({
      ok: false,
      error: 'not_found',
    });
    expect((await reportBySecret(ports, 'other', inv.value.id)).ok).toBe(true);
  });
});

describe('настройки магазина', () => {
  it('срок оплаты нового счёта - через дни из настроек; 0 - без срока', async () => {
    state.settings = shopSettings({ invoiceDueDays: 5 });
    const o = await order([{ offer: 2, quantity: 1 }], 'n1');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    expect(inv.ok && inv.value.dueAt).toBe('2026-10-28T12:00:00.000Z');

    if (!inv.ok) throw new Error(inv.error);
    await deleteDraft(ports, inv.value.id);
    state.settings = shopSettings({ invoiceDueDays: 0 });
    const next = await createInvoice(ports, o.id);
    expect(next.ok && next.value.dueAt).toBeNull();
  });

  it('обязательная почта: заказ без почты не оформляется, остаток не тронут', async () => {
    state.settings = shopSettings({ checkout: { email: 'required' } });
    const r = await placeOrder(ports, {
      cart: [{ offer: 1, quantity: 1 }],
      buyer,
      secretHash: 'n2',
    });
    expect(r.ok ? null : r.error).toBe('invalid');
    expect(state.offers.get(1)?.stock).toBe(1);
  });
});

describe('бронь', () => {
  async function pay(id: string | number) {
    await changeInvoice(ports, id, 'issue', 'manager');
    const paid = await changeInvoice(ports, id, 'confirm', 'manager');
    if (!paid.ok) throw new Error(paid.error);
    return paid.value;
  }

  it('счёт на бронь, затем основной - цена минус бронь; коды только по основному', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd1');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const deposit = await createInvoice(ports, o.id, { purpose: 'deposit' });
    if (!deposit.ok) throw new Error(deposit.error);
    expect(deposit.value.total).toBe(10_000);
    expect(deposit.value.lines[0]?.title).toBe('Бронь: Курс с бронью');
    expect((await pay(deposit.value.id)).codes).toEqual([]);

    const rest = await createInvoice(ports, o.id);
    if (!rest.ok) throw new Error(rest.error);
    expect(rest.value.purpose).toBe('payment');
    expect(rest.value.total).toBe(50_000);
    expect((await pay(rest.value.id)).codes).toHaveLength(1);
  });

  it('второй счёт на бронь - отказ; бронь без позиций с бронью - отказ', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd2');
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect((await createInvoice(ports, o.id, { purpose: 'deposit' })).ok).toBe(true);
    expect(await createInvoice(ports, o.id, { purpose: 'deposit' })).toEqual({
      ok: false,
      error: 'forbidden',
    });

    const plain = await order([{ offer: 2, quantity: 1 }], 'd3');
    await changeOrder(ports, plain.id, 'accept', 'manager');
    expect(await createInvoice(ports, plain.id, { purpose: 'deposit' })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('неоплаченная бронь цену не уменьшает: её ещё можно удалить или аннулировать', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd5');
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect((await createInvoice(ports, o.id, { purpose: 'deposit' })).ok).toBe(true);
    const inv = await createInvoice(ports, o.id);
    expect(inv.ok && inv.value.total).toBe(60_000);
  });

  it('строка позиции в счёте на бронь доступа не выдаёт', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd6');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const dep = await createInvoice(ports, o.id, { purpose: 'deposit' });
    if (!dep.ok) throw new Error(dep.error);
    const edited = await updateDraft(ports, dep.value.id, {
      lines: [{ offer: 5, title: 'Курс с бронью', quantity: 1, price: 10_000 }],
    });
    expect(edited.ok && edited.value.lines[0]?.access).toBeNull();
  });

  it('без счёта на бронь основной счёт - полная цена', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd4');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    expect(inv.ok && inv.value.total).toBe(60_000);
  });
});

describe('доступ к видео', () => {
  it('оплата выдаёт код на каждую единицу строки с доступом', async () => {
    const o = await order([
      { offer: 3, quantity: 2 },
      { offer: 2, quantity: 1 },
    ]);
    const paid = await paidInvoice(o);
    expect(paid.codes).toHaveLength(2);
    expect([...state.codes.values()].every((c) => c.access === 77 && !c.revoked)).toBe(true);
  });

  it('частичный возврат оставляет доступ, полный - отзывает; счёт остаётся оплаченным', async () => {
    const o = await order([{ offer: 3, quantity: 1 }]);
    const paid = await paidInvoice(o);
    const pay = async (amount: number) => {
      const r = await createRefund(ports, paid.id, { amount });
      if (!r.ok) throw new Error(r.error);
      await changeInvoice(ports, r.value.id, 'issue', 'manager');
      expect(await changeInvoice(ports, r.value.id, 'report', 'buyer')).toEqual({
        ok: false,
        error: 'forbidden',
      });
      await changeInvoice(ports, r.value.id, 'confirm', 'manager');
    };
    await pay(500_000);
    expect([...state.codes.values()].some((c) => c.revoked)).toBe(false);
    await pay(paid.total - 500_000);
    expect([...state.codes.values()].every((c) => c.revoked)).toBe(true);
    expect(state.invoices.get(String(paid.id))?.status).toBe('paid');
    expect(state.invoices.get(String(paid.id))?.codes).toEqual([]);
  });

  it('возвраты частями до суммы счёта, сверх неё - отказ', async () => {
    const o = await order([{ offer: 3, quantity: 1 }]);
    const paid = await paidInvoice(o);
    expect(await createRefund(ports, paid.id, { amount: paid.total + 1 })).toEqual({
      ok: false,
      error: 'invalid',
    });
    expect((await createRefund(ports, paid.id, { amount: 100 })).ok).toBe(true);
    const rest = await createRefund(ports, paid.id);
    expect(rest.ok && rest.value.total).toBe(paid.total - 100);
    expect(await createRefund(ports, paid.id)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('после частичного возврата остаток денег можно вернуть и отменить заказ', async () => {
    const o = await order();
    const paid = await paidInvoice(o);
    for (const amount of [1_000_000, paid.total - 1_000_000]) {
      const r = await createRefund(ports, paid.id, { amount });
      if (!r.ok) throw new Error(r.error);
      await changeInvoice(ports, r.value.id, 'issue', 'manager');
      await changeInvoice(ports, r.value.id, 'confirm', 'manager');
    }
    expect((await changeOrder(ports, o.id, 'cancel', 'manager')).ok).toBe(true);
    expect(state.offers.get(1)?.stock).toBe(1);
  });
});
