import { describe, expect, it } from 'vitest';

import {
  type Actor,
  canInvoice,
  canOrder,
  fullyRefunded,
  heldAmount,
  INVOICE_FINAL,
  INVOICE_OPEN,
  INVOICE_TRANSITIONS,
  type InvoiceAction,
  type InvoiceKind,
  type InvoiceStatus,
  isOverdue,
  refundable,
  ORDER_FINAL,
  ORDER_TRANSITIONS,
  type OrderAction,
  type OrderStatus,
} from './shop';

/**
 * Проверка дизайна магазина перебором всего пространства (docs/whg/43-shop.md,
 * «Как проверяется дизайн»).
 *
 * Модель - один заказ на штучную позицию (остаток 1), до двух счетов на оплату
 * и возвраты к ним. Обходом в ширину берутся все состояния, достижимые при всех
 * действиях всех участников; на каждом проверяются инварианты, из каждого - что
 * путь к развязке и к отмене есть. Проверка проверена мутациями таблицы: каждая
 * сломанная строка роняет хотя бы одно свойство.
 */

const ACTORS: readonly Actor[] = ['buyer', 'manager', 'system'];
const KINDS: readonly InvoiceKind[] = ['invoice', 'refund'];
const ORDER_STATUSES: readonly OrderStatus[] = ['new', 'accepted', 'done', 'cancelled'];
const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  'draft',
  'issued',
  'reported',
  'paid',
  'voided',
];
const ORDER_ACTIONS = Object.keys(ORDER_TRANSITIONS) as OrderAction[];
const INVOICE_ACTIONS = Object.keys(INVOICE_TRANSITIONS) as InvoiceAction[];
const MAX_INVOICES = 2;
const STOCK = 1;

interface Invoice {
  readonly kind: InvoiceKind;
  readonly status: InvoiceStatus;
  /** Имя счёта на оплату (`a`, `b`); у возврата - null. Ссылки идут по имени, как по id в базе. */
  readonly id: string | null;
  /** Возврат - имя счёта, который он возвращает. */
  readonly of: string | null;
  readonly total: number;
  /** Действуют ли сейчас коды доступа по строкам этого счёта. */
  readonly codes: boolean;
  /** Сколько раз коды выдавались; насыщается на 2, чтобы пространство было конечным. */
  readonly grants: number;
}

interface World {
  readonly order: OrderStatus;
  readonly stock: number;
  readonly invoices: readonly Invoice[];
}

const START: World = { order: 'new', stock: STOCK - 1, invoices: [] };

const INVOICE_IDS = ['a', 'b'] as const;

const INVOICE_TOTAL = 2;
const MAX_WORLDS = 50_000;

const refundsOf = (invoices: readonly Invoice[], id: string | null) =>
  invoices.filter((r) => r.kind === 'refund' && r.of === id);

function applyOrder(w: World, action: OrderAction, actor: Actor): World | null {
  if (!canOrder(w.order, action, actor)) return null;
  const to = ORDER_TRANSITIONS[action].to;
  if (to !== 'cancelled') return { ...w, order: to };
  // И-6: полученное по заказу сначала возвращается.
  if (heldAmount(w.invoices) !== 0) return null;
  // Черновики удаляются, открытые счета аннулируются.
  return {
    order: to,
    stock: w.stock + 1,
    invoices: w.invoices
      .filter((i) => i.status !== 'draft')
      .map((i) => (INVOICE_OPEN.includes(i.status) ? { ...i, status: 'voided' as const } : i)),
  };
}

function applyInvoice(w: World, index: number, action: InvoiceAction, actor: Actor): World | null {
  const inv = w.invoices[index];
  if (!inv || !canInvoice(inv.status, action, actor, inv.kind)) return null;
  const to = INVOICE_TRANSITIONS[action].to;
  // Абстракция модели: аннулированный возврат не деньги и не коды, ни на что не влияет -
  // модель его убирает. Иначе возвраты «завёл - аннулировал» копились бы без конца.
  // На возврат никто не ссылается, поэтому убрать его можно из любого места.
  if (inv.kind === 'refund' && to === 'voided') {
    return { ...w, invoices: w.invoices.filter((_, i) => i !== index) };
  }
  let invoices = w.invoices.map((x, i) => (i === index ? { ...x, status: to } : x));
  if (to === 'paid' && inv.kind === 'invoice') {
    invoices = invoices.map((x, i) =>
      i === index ? { ...x, codes: true, grants: Math.min(x.grants + 1, 2) } : x,
    );
  }
  if (to === 'paid' && inv.kind === 'refund') {
    // Доступ отзывает только полный возврат: часть денег за курс - курс остаётся.
    const source = invoices.find((x) => x.id === inv.of)!;
    if (fullyRefunded(source.total, refundsOf(invoices, inv.of))) {
      invoices = invoices.map((x) => (x.id === inv.of ? { ...x, codes: false } : x));
    }
  }
  return { ...w, invoices };
}

function steps(w: World): World[] {
  const out: World[] = [];
  for (const actor of ACTORS) {
    for (const action of ORDER_ACTIONS) {
      const next = applyOrder(w, action, actor);
      if (next) out.push(next);
    }
    w.invoices.forEach((_, index) => {
      for (const action of INVOICE_ACTIONS) {
        const next = applyInvoice(w, index, action, actor);
        if (next) out.push(next);
      }
    });
  }
  // Счёт на 2 единицы: возврат бывает на 1 (часть денег) и на 2 (всё).
  const blank = { codes: false, grants: 0, total: INVOICE_TOTAL } as const;
  // Счёт заводит менеджер к принятому заказу.
  const freeId = INVOICE_IDS.find((id) => !w.invoices.some((i) => i.id === id));
  if (
    w.order === 'accepted' &&
    freeId &&
    w.invoices.filter((i) => i.kind === 'invoice').length < MAX_INVOICES
  ) {
    out.push({
      ...w,
      invoices: [
        ...w.invoices,
        { ...blank, kind: 'invoice', status: 'draft', id: freeId, of: null },
      ],
    });
  }
  // Возврат - к оплаченному счёту, частями, пока сумма возвратов не дошла до
  // суммы счёта; и после «выполнен» тоже.
  if (w.order !== 'cancelled') {
    for (const inv of w.invoices) {
      if (inv.kind !== 'invoice' || inv.status !== 'paid') continue;
      const left = refundable(inv.total, refundsOf(w.invoices, inv.id));
      for (let amount = 1; amount <= left; amount += 1) {
        out.push({
          ...w,
          invoices: [
            ...w.invoices,
            { ...blank, total: amount, kind: 'refund', status: 'draft', id: null, of: inv.id },
          ],
        });
      }
    }
  }
  // Черновик удаляется, а не аннулируется; на черновик возврат не ссылается.
  w.invoices.forEach((inv, index) => {
    if (inv.status === 'draft')
      out.push({ ...w, invoices: w.invoices.filter((_, i) => i !== index) });
  });
  return out;
}

const key = (w: World): string => JSON.stringify(w);

function explore(): World[] {
  const seen = new Map<string, World>([[key(START), START]]);
  const queue: World[] = [START];
  while (queue.length > 0) {
    for (const next of steps(queue.shift()!)) {
      const k = key(next);
      if (!seen.has(k)) {
        seen.set(k, next);
        queue.push(next);
        // Конечность - часть спецификации: бесконечное пространство значит, что
        // таблица что-то копит без предела (например, возвраты сверх счёта).
        if (seen.size > MAX_WORLDS)
          throw new Error(`больше ${MAX_WORLDS} состояний: пространство не конечно`);
      }
    }
  }
  return [...seen.values()];
}

const worlds = explore();

/** Обратный граф переходов: строится один раз, по нему идут все проверки достижимости. */
const predecessors = new Map<string, string[]>();
for (const w of worlds) {
  const from = key(w);
  for (const n of steps(w)) {
    const to = key(n);
    const list = predecessors.get(to);
    if (list) list.push(from);
    else predecessors.set(to, [from]);
  }
}

/** Состояния, из которых достижимо хоть одно, где выполнено `goal`: обход от цели назад. */
function canReach(all: readonly World[], goal: (w: World) => boolean): Set<string> {
  const good = new Set(all.filter(goal).map(key));
  const queue = [...good];
  while (queue.length > 0) {
    for (const prev of predecessors.get(queue.pop()!) ?? []) {
      if (!good.has(prev)) {
        good.add(prev);
        queue.push(prev);
      }
    }
  }
  return good;
}

describe('таблица переходов', () => {
  it('из конечных состояний выхода нет', () => {
    for (const s of ORDER_FINAL) {
      for (const a of ORDER_ACTIONS)
        for (const actor of ACTORS) expect(canOrder(s, a, actor)).toBe(false);
    }
    for (const s of INVOICE_FINAL) {
      for (const a of INVOICE_ACTIONS) {
        for (const actor of ACTORS)
          for (const k of KINDS) expect(canInvoice(s, a, actor, k)).toBe(false);
      }
    }
  });

  it('покупатель и система отменяют только новый заказ', () => {
    for (const actor of ['buyer', 'system'] as const) {
      expect(canOrder('new', 'cancel', actor)).toBe(true);
      expect(canOrder('accepted', 'cancel', actor)).toBe(false);
    }
  });

  it('И-7: покупатель со счётом только заявляет оплату и только по счёту на оплату', () => {
    for (const s of INVOICE_STATUSES) {
      for (const a of INVOICE_ACTIONS) {
        for (const k of KINDS) {
          if (a !== 'report' || k === 'refund') expect(canInvoice(s, a, 'buyer', k)).toBe(false);
        }
      }
    }
  });

  it('просрочка - вычисление: выставлен и срок прошёл', () => {
    const now = new Date('2026-10-23T12:00:00Z');
    expect(isOverdue({ status: 'issued', dueAt: '2026-10-22T00:00:00Z' }, now)).toBe(true);
    expect(isOverdue({ status: 'issued', dueAt: '2026-10-24T00:00:00Z' }, now)).toBe(false);
    expect(isOverdue({ status: 'paid', dueAt: '2026-10-22T00:00:00Z' }, now)).toBe(false);
    expect(isOverdue({ status: 'issued', dueAt: null }, now)).toBe(false);
  });
});

describe('перебор достижимых состояний', () => {
  it('модель конечна, все состояния заказа и счёта достижимы', () => {
    expect(worlds.length).toBeLessThan(20_000);
    for (const s of ORDER_STATUSES) expect(worlds.some((w) => w.order === s)).toBe(true);
    for (const s of INVOICE_STATUSES) {
      for (const k of KINDS) {
        // О возврате покупатель не заявляет: «оплата заявлена» у возврата недостижима намеренно;
        // аннулированный возврат модель убирает (см. applyInvoice).
        const expected = !(k === 'refund' && (s === 'reported' || s === 'voided'));
        expect(worlds.some((w) => w.invoices.some((i) => i.status === s && i.kind === k))).toBe(
          expected,
        );
      }
    }
  });

  it('И-2: остаток не ниже нуля и возвращается ровно при отмене', () => {
    for (const w of worlds) expect(w.stock).toBe(w.order === 'cancelled' ? STOCK : STOCK - 1);
  });

  it('И-5: коды действуют ровно у оплаченного и не возвращённого счёта, выданы не больше раза', () => {
    for (const w of worlds) {
      for (const i of w.invoices.filter((x) => x.kind === 'invoice')) {
        const full = fullyRefunded(i.total, refundsOf(w.invoices, i.id));
        expect(i.codes).toBe(i.status === 'paid' && !full);
        expect(i.grants).toBeLessThanOrEqual(1);
      }
    }
  });

  it('И-6: у отменённого заказа деньги возвращены, живых счетов нет', () => {
    for (const w of worlds.filter((x) => x.order === 'cancelled')) {
      expect(heldAmount(w.invoices)).toBe(0);
      for (const i of w.invoices) expect(INVOICE_FINAL).toContain(i.status);
    }
  });

  it('живые возвраты не превышают сумму счёта', () => {
    for (const w of worlds) {
      for (const inv of w.invoices.filter((i) => i.kind === 'invoice')) {
        expect(refundable(inv.total, refundsOf(w.invoices, inv.id))).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('возврат ссылается только на оплаченный счёт', () => {
    for (const w of worlds) {
      for (const r of w.invoices.filter((i) => i.kind === 'refund')) {
        expect(w.invoices.find((i) => i.id === r.of)?.status).toBe('paid');
      }
    }
  });

  it('отклонённая заявка об оплате оставляет тот же счёт к оплате', () => {
    // Покупатель нажал «я оплатил» раньше, чем дошли деньги: отказ не должен
    // хоронить счёт, иначе менеджер выписывает его заново.
    const payable = new Map<string, Set<string>>(
      INVOICE_IDS.map((id) => [
        id,
        canReach(worlds, (x) => x.invoices.some((i) => i.id === id && i.status === 'paid')),
      ]),
    );
    for (const w of worlds) {
      w.invoices.forEach((inv, index) => {
        const next = applyInvoice(w, index, 'reject', 'manager');
        if (!next || inv.id === null) return;
        expect(payable.get(inv.id)!.has(key(next))).toBe(true);
      });
    }
  });

  it('сделка срывается из любого незавершённого заказа: отмена достижима', () => {
    const cancellable = canReach(worlds, (w) => w.order === 'cancelled');
    const stuck = worlds.filter((w) => !ORDER_FINAL.includes(w.order) && !cancellable.has(key(w)));
    expect(stuck).toEqual([]);
  });

  it('И-4: из любого состояния есть путь к развязке', () => {
    const settled = canReach(
      worlds,
      (w) =>
        ORDER_FINAL.includes(w.order) && w.invoices.every((i) => INVOICE_FINAL.includes(i.status)),
    );
    expect(worlds.filter((w) => !settled.has(key(w)))).toEqual([]);
  });
});
