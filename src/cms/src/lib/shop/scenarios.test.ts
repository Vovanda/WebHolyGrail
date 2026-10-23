import { type OfferSnapshot, shopSettings } from 'contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  changeInvoice,
  createInvoice,
  createRefund,
  declineBySecret,
  deleteDraft,
  reportBySecret,
  updateDraft,
} from './invoices';
import { memoryPorts, memoryState, type MemoryState } from './memory-store';
import { cancelBySecret, cancelStaleOrders, changeOrder, placeOrder, removeLine } from './orders';
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
  howToBuy: 'cart',
  deposit: null,
};
const FOOD: OfferSnapshot = {
  id: 2,
  title: 'Корм 15 кг',
  price: 450_000,
  stock: null,
  howToBuy: 'cart',
  deposit: null,
};
const COURSE: OfferSnapshot = {
  id: 3,
  title: 'Курс «Сила»',
  price: 990_000,
  stock: null,
  howToBuy: 'cart',
  deposit: null,
};
const COURSE_WITH_DEPOSIT: OfferSnapshot = {
  id: 5,
  title: 'Курс с бронью',
  price: 60_000,
  stock: null,
  howToBuy: 'cart',
  deposit: 10_000,
};
const PUPPY_BY_REQUEST: OfferSnapshot = {
  id: 4,
  title: 'Щенок Рада',
  price: 6_000_000,
  stock: 1,
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
    await changeOrder(ports, o.id, 'cancel', 'manager', 'нет в наличии');
    expect(state.offers.get(4)?.stock).toBe(1);

    const p = await order([{ offer: 4, quantity: 1 }], 'r4');
    await changeOrder(ports, p.id, 'accept', 'manager');
    await changeOrder(ports, p.id, 'cancel', 'manager', 'нет в наличии');
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

  it('у отмены всегда есть причина: менеджер пишет свою, покупателю и системе она ставится сама', async () => {
    const byManager = await order([{ offer: 1, quantity: 1 }], 'm');
    expect(await changeOrder(ports, byManager.id, 'cancel', 'manager', '  ')).toEqual({
      ok: false,
      error: 'reason_required',
    });
    expect(state.orders.get(String(byManager.id))?.status).toBe('new');
    await changeOrder(ports, byManager.id, 'cancel', 'manager', ' нет в наличии ');
    expect(state.orders.get(String(byManager.id))?.cancelReason).toBe('нет в наличии');

    const byBuyer = await order([{ offer: 2, quantity: 1 }], 'b');
    await cancelBySecret(ports, 'b');
    expect(state.orders.get(String(byBuyer.id))?.cancelReason).toBe('Отменён покупателем');

    const bySystem = await order([{ offer: 2, quantity: 1 }], 's');
    state.now = new Date(state.now.getTime() + 73 * 3_600_000);
    await cancelStaleOrders(ports);
    expect(state.orders.get(String(bySystem.id))?.cancelReason).toBe('Не принят вовремя');
  });

  it('чужая ссылка не находит заказ', async () => {
    await order();
    expect(await cancelBySecret(ports, 'чужая')).toEqual({ ok: false, error: 'not_found' });
  });

  it('выполненный покупатель не отменяет', async () => {
    const o = await order();
    await changeOrder(ports, o.id, 'accept', 'manager');
    await changeOrder(ports, o.id, 'complete', 'manager');
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
    expect(await changeOrder(ports, o.id, 'cancel', 'manager', 'нет в наличии')).toEqual({
      ok: false,
      error: 'money_held',
    });
    const refund = await createRefund(ports, paid.id);
    if (!refund.ok) throw new Error(refund.error);
    await changeInvoice(ports, refund.value.id, 'issue', 'manager');
    await changeInvoice(ports, refund.value.id, 'confirm', 'manager');
    expect((await changeOrder(ports, o.id, 'cancel', 'manager', 'нет в наличии')).ok).toBe(true);
    expect(state.offers.get(1)?.stock).toBe(1);
  });

  it('открытые счета аннулируются, черновики удаляются', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'c1');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const a = await createInvoice(ports, o.id);
    const b = await createInvoice(ports, o.id, { purpose: 'deposit' });
    if (!a.ok || !b.ok) throw new Error('счёт');
    await changeInvoice(ports, a.value.id, 'issue', 'manager');
    await changeOrder(ports, o.id, 'cancel', 'manager', 'нет в наличии');
    expect(state.invoices.get(String(a.value.id))?.status).toBe('voided');
    expect(state.invoices.has(String(b.value.id))).toBe(false);
  });
});

describe('счёт', () => {
  it('к новому заказу счёт не выставляется', async () => {
    const o = await order();
    expect(await createInvoice(ports, o.id)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('мембраны: строки из заказа как есть, доставка, позиция каталога и скидка - вторым списком', async () => {
    const o = await order([{ offer: 2, quantity: 3 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const extra = [
      {
        kind: 'charge' as const,
        title: 'Доставка',
        offer: null,
        quantity: 1,
        price: 150_000,
        appliesTo: null,
      },
      // Цена из формы не берётся: позиция каталога идёт по цене каталога.
      { kind: 'offer' as const, title: '', offer: 3, quantity: 1, price: 1, appliesTo: null },
      {
        kind: 'discount' as const,
        title: 'Промокод',
        offer: null,
        quantity: 1,
        price: 50_000,
        appliesTo: 2,
      },
    ];
    const inv = await createInvoice(ports, o.id, { extra });
    if (!inv.ok) throw new Error(inv.error);
    expect(inv.value.lines.map((l) => [l.offer, l.quantity, l.price])).toEqual([[2, 3, 450_000]]);
    expect(inv.value.extra.map((l) => l.sum)).toEqual([150_000, 990_000, -50_000]);
    expect(inv.value.total).toBe(3 * 450_000 + 150_000 + 990_000 - 50_000);
    const big = await updateDraft(ports, inv.value.id, {
      extra: [{ ...extra[2]!, price: 3 * 450_000 + 1 }],
    });
    expect(big).toEqual({ ok: false, error: 'discount_too_large' });
  });

  it('второй живой основной счёт - отказ: иначе вторые коды за ту же покупку', async () => {
    const o = await order([{ offer: 3, quantity: 1 }], 'p2');
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect((await createInvoice(ports, o.id)).ok).toBe(true);
    expect(await createInvoice(ports, o.id)).toEqual({ ok: false, error: 'forbidden' });
  });

  it('позиция каталога без цены во втором списке - отказ', async () => {
    const o = await order([{ offer: 2, quantity: 1 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const r = await createInvoice(ports, o.id, {
      extra: [{ kind: 'offer', title: '', offer: 99, quantity: 1, price: 1, appliesTo: null }],
    });
    expect(r).toEqual({ ok: false, error: 'invalid' });
  });

  it('срок оплаты встаёт при выставлении, а не при создании черновика', async () => {
    const o = await order([{ offer: 2, quantity: 1 }]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    if (!inv.ok) throw new Error(inv.error);
    expect(inv.value.dueAt).toBeNull();
    const issued = await changeInvoice(ports, inv.value.id, 'issue', 'manager');
    expect(issued.ok && issued.value.dueAt).toBeTruthy();
  });

  it('аннулирование менеджером - с причиной, отказ покупателя - своей причиной', async () => {
    const o = await order([{ offer: 2, quantity: 1 }], 'h-void');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    if (!inv.ok) throw new Error(inv.error);
    await changeInvoice(ports, inv.value.id, 'issue', 'manager');
    expect(await changeInvoice(ports, inv.value.id, 'void', 'manager', '  ')).toEqual({
      ok: false,
      error: 'reason_required',
    });
    const declined = await declineBySecret(ports, 'h-void', inv.value.id);
    expect(declined.ok && [declined.value.status, declined.value.voidReason]).toEqual([
      'voided',
      'Покупатель отказался',
    ]);
    expect(await declineBySecret(ports, 'чужой', inv.value.id)).toEqual({
      ok: false,
      error: 'not_found',
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

describe('снятие строки и отмена покупателем', () => {
  it('строка снята с причиной: остаток вернулся один раз, итог без неё', async () => {
    const o = await order([
      { offer: 1, quantity: 1 },
      { offer: 2, quantity: 2 },
    ]);
    const r = await removeLine(ports, o.id, 0, 'нет в наличии');
    expect(r.ok && [r.value.total, r.value.lines[0]!.removed]).toEqual([900_000, 'нет в наличии']);
    expect(state.offers.get(1)?.stock).toBe(1);
    expect(await removeLine(ports, o.id, 0, 'ещё раз')).toEqual({ ok: false, error: 'forbidden' });
    expect(state.offers.get(1)?.stock).toBe(1);
    expect(await removeLine(ports, o.id, 1, 'последняя')).toEqual({
      ok: false,
      error: 'last_line',
    });
  });

  it('пока есть живой счёт, строку не снимают; снятая в счёт не идёт', async () => {
    const o = await order([
      { offer: 2, quantity: 1 },
      { offer: 3, quantity: 1 },
    ]);
    await changeOrder(ports, o.id, 'accept', 'manager');
    expect((await removeLine(ports, o.id, 1, 'нет мест')).ok).toBe(true);
    const inv = await createInvoice(ports, o.id);
    expect(inv.ok && inv.value.lines.map((l) => l.offer)).toEqual([2]);
    expect(await removeLine(ports, o.id, 0, 'нет')).toEqual({ ok: false, error: 'last_line' });
  });

  it('покупатель отменяет принятый заказ без оплат, но не с заявленной оплатой', async () => {
    const a = await order([{ offer: 2, quantity: 1 }], 'ha');
    await changeOrder(ports, a.id, 'accept', 'manager');
    expect((await cancelBySecret(ports, 'ha')).ok).toBe(true);

    const b = await order([{ offer: 2, quantity: 1 }], 'hb');
    await changeOrder(ports, b.id, 'accept', 'manager');
    const inv = await createInvoice(ports, b.id);
    if (!inv.ok) throw new Error(inv.error);
    await changeInvoice(ports, inv.value.id, 'issue', 'manager');
    await reportBySecret(ports, 'hb', inv.value.id);
    expect(await cancelBySecret(ports, 'hb')).toEqual({ ok: false, error: 'money_held' });
  });
});

describe('настройки магазина', () => {
  it('срок оплаты - через дни из настроек от выставления; 0 - без срока', async () => {
    state.settings = shopSettings({ invoiceDueDays: 5 });
    const o = await order([{ offer: 2, quantity: 1 }], 'n1');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    if (!inv.ok) throw new Error(inv.error);
    const issued = await changeInvoice(ports, inv.value.id, 'issue', 'manager');
    expect(issued.ok && issued.value.dueAt).toBe('2026-10-28T12:00:00.000Z');

    await changeInvoice(ports, inv.value.id, 'void', 'manager', 'пересчёт');
    state.settings = shopSettings({ invoiceDueDays: 0 });
    const next = await createInvoice(ports, o.id);
    if (!next.ok) throw new Error(next.error);
    const nextIssued = await changeInvoice(ports, next.value.id, 'issue', 'manager');
    expect(nextIssued.ok && nextIssued.value.dueAt).toBeNull();
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

  it('счёт на бронь, затем основной - цена минус бронь', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd1');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const deposit = await createInvoice(ports, o.id, { purpose: 'deposit' });
    if (!deposit.ok) throw new Error(deposit.error);
    expect(deposit.value.total).toBe(10_000);
    expect(deposit.value.lines[0]?.title).toBe('Бронь: Курс с бронью');
    expect((await pay(deposit.value.id)).status).toBe('paid');

    const rest = await createInvoice(ports, o.id);
    if (!rest.ok) throw new Error(rest.error);
    expect(rest.value.purpose).toBe('payment');
    expect(rest.value.total).toBe(50_000);
    expect((await pay(rest.value.id)).status).toBe('paid');
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

  it('без счёта на бронь основной счёт - полная цена', async () => {
    const o = await order([{ offer: 5, quantity: 1 }], 'd4');
    await changeOrder(ports, o.id, 'accept', 'manager');
    const inv = await createInvoice(ports, o.id);
    expect(inv.ok && inv.value.total).toBe(60_000);
  });
});

describe('возвраты', () => {
  it('частичный и полный возврат; счёт остаётся оплаченным', async () => {
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
    await pay(paid.total - 500_000);
    expect(state.invoices.get(String(paid.id))?.status).toBe('paid');
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
    expect((await changeOrder(ports, o.id, 'cancel', 'manager', 'нет в наличии')).ok).toBe(true);
    expect(state.offers.get(1)?.stock).toBe(1);
  });
});
