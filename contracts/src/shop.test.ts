import { describe, expect, it } from 'vitest';

import {
  type Actor,
  canInvoice,
  canOrder,
  removeOrderLine,
  boughtTogether,
  buildOrder,
  currentPrice,
  extraLines,
  spreadDiscount,
  type ExtraLineInput,
  heldAmount,
  type HowToBuy,
  HOW_TO_BUY,
  INVOICE_FINAL,
  INVOICE_OPEN,
  INVOICE_TRANSITIONS,
  type InvoiceAction,
  type InvoiceKind,
  type InvoiceStatus,
  isOverdue,
  refundable,
  stockMoves,
  ORDER_FINAL,
  ORDER_TRANSITIONS,
  type OrderAction,
  type OrderStatus,
} from './shop';

/**
 * Проверка дизайна магазина перебором всего пространства (docs/whg/43-shop.md,
 * «Как проверяется дизайн»).
 *
 * Модель - один заказ на штучную позицию (остаток 1), купленную корзиной или
 * заявкой, до двух счетов на оплату и возвраты к ним. Обходом в ширину берутся все состояния, достижимые при всех
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
}

interface World {
  readonly mode: HowToBuy;
  readonly order: OrderStatus;
  readonly stock: number;
  readonly invoices: readonly Invoice[];
}

/** Оформление: корзина списывает остаток сразу, заявка - нет. */
const STARTS: readonly World[] = HOW_TO_BUY.map((mode) => {
  const { take } = stockMoves([{ mode }], null, 'new');
  return { mode, order: 'new', stock: STOCK - take.length, invoices: [] };
});

/** Остаток после перехода заказа - по правилу, кто держит остаток. */
const restock = (w: World, to: OrderStatus): number => {
  const moves = stockMoves([{ mode: w.mode }], w.order, to);
  return w.stock - moves.take.length + moves.giveBack.length;
};

const INVOICE_IDS = ['a', 'b'] as const;

const INVOICE_TOTAL = 2;
const MAX_WORLDS = 50_000;

const refundsOf = (invoices: readonly Invoice[], id: string | null) =>
  invoices.filter((r) => r.kind === 'refund' && r.of === id);

function applyOrder(w: World, action: OrderAction, actor: Actor): World | null {
  if (!canOrder(w.order, action, actor)) return null;
  const to = ORDER_TRANSITIONS[action].to;
  if (to !== 'cancelled') {
    const stock = restock(w, to);
    // Принять заявку на позицию, которой нет, нельзя: списание откажет.
    if (stock < 0) return null;
    return { ...w, order: to, stock };
  }
  // И-6: полученное по заказу сначала возвращается.
  if (heldAmount(w.invoices) !== 0) return null;
  // Черновики удаляются, открытые счета аннулируются.
  return {
    mode: w.mode,
    order: to,
    stock: restock(w, to),
    invoices: w.invoices
      .filter((i) => i.status !== 'draft')
      .map((i) => (INVOICE_OPEN.includes(i.status) ? { ...i, status: 'voided' as const } : i)),
  };
}

function applyInvoice(w: World, index: number, action: InvoiceAction, actor: Actor): World | null {
  const inv = w.invoices[index];
  if (!inv || !canInvoice(inv.status, action, actor, inv.kind)) return null;
  const to = INVOICE_TRANSITIONS[action].to;
  // Абстракция модели: аннулированный возврат не деньги, ни на что не влияет -
  // модель его убирает. Иначе возвраты «завёл - аннулировал» копились бы без конца.
  // На возврат никто не ссылается, поэтому убрать его можно из любого места.
  if (inv.kind === 'refund' && to === 'voided') {
    return { ...w, invoices: w.invoices.filter((_, i) => i !== index) };
  }
  const invoices = w.invoices.map((x, i) => (i === index ? { ...x, status: to } : x));
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
  const blank = { total: INVOICE_TOTAL } as const;
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
  const seen = new Map<string, World>(STARTS.map((s) => [key(s), s]));
  const queue: World[] = [...STARTS];
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

  it('система отменяет только новый заказ, покупатель - и принятый', () => {
    expect(canOrder('new', 'cancel', 'system')).toBe(true);
    expect(canOrder('accepted', 'cancel', 'system')).toBe(false);
    // Принятый - пока нет оплат: это проверяет сценарий по счетам заказа.
    expect(canOrder('accepted', 'cancel', 'buyer')).toBe(true);
    expect(canOrder('done', 'cancel', 'buyer')).toBe(false);
  });

  it('И-7: покупатель со счётом только заявляет оплату или отказывается, и только по счёту на оплату', () => {
    for (const s of INVOICE_STATUSES) {
      for (const a of INVOICE_ACTIONS) {
        for (const k of KINDS) {
          if ((a !== 'report' && a !== 'decline') || k === 'refund')
            expect(canInvoice(s, a, 'buyer', k)).toBe(false);
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
    // Остаток за покупателем: корзина - с оформления, заявка - с принятия; отмена возвращает.
    const held = (w: World) => w.order !== 'cancelled' && (w.mode === 'cart' || w.order !== 'new');
    for (const w of worlds) expect(w.stock).toBe(held(w) ? STOCK - 1 : STOCK);
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

describe('снятие строки заказа', () => {
  const line = (offer: number, sum: number, mode: 'cart' | 'request' = 'cart') => ({
    offer,
    title: `позиция ${offer}`,
    quantity: 1,
    price: sum,
    sum,
    mode,
    deposit: null,
  });
  const lines = [line(1, 100), line(2, 50, 'request')];

  it('строка остаётся помеченной, итог без неё, остаток возвращается только у державшей', () => {
    const r = removeOrderLine('new', lines, 0, ' нет в наличии ');
    expect(r.ok && r.lines[0]!.removed).toBe('нет в наличии');
    expect(r.ok && r.total).toBe(50);
    expect(r.ok && r.giveBack.map((l) => l.offer)).toEqual([1]);
    // Заявка в новом заказе остаток не держит - возвращать нечего.
    const req = removeOrderLine('new', lines, 1, 'нет');
    expect(req.ok && req.giveBack).toEqual([]);
  });

  it('без причины, дважды, последнюю и в конечном заказе - нельзя', () => {
    expect(removeOrderLine('new', lines, 0, '  ')).toEqual({ ok: false, error: 'reason_required' });
    const once = removeOrderLine('accepted', lines, 0, 'нет');
    expect(once.ok && removeOrderLine('accepted', once.lines, 0, 'нет')).toEqual({
      ok: false,
      error: 'forbidden',
    });
    expect(once.ok && removeOrderLine('accepted', once.lines, 1, 'нет')).toEqual({
      ok: false,
      error: 'last_line',
    });
    expect(removeOrderLine('done', lines, 0, 'нет')).toEqual({ ok: false, error: 'forbidden' });
  });
});

describe('добавленные строки счёта и скидки', () => {
  const base = [
    { offer: 1, sum: 300 },
    { offer: 2, sum: 100 },
  ];
  const catalog = (id: number) => (id === 7 ? { title: 'Корм', price: 50 } : null);
  const ext = (o: Partial<ExtraLineInput>): ExtraLineInput => ({
    kind: 'charge',
    title: 'Доставка',
    offer: null,
    quantity: 1,
    price: 0,
    appliesTo: null,
    ...o,
  });

  it('скидка на заказ раскладывается по строкам, доли в сумме равны скидке', () => {
    expect(spreadDiscount([300, 100], 100)).toEqual([75, 25]);
    const odd = spreadDiscount([1, 1, 1], 2);
    expect(odd.reduce((t, x) => t + x, 0)).toBe(2);
    expect(spreadDiscount([0, 0], 5)).toEqual([0, 0]);
  });

  it('доставка, позиция по цене каталога и скидки складываются в сумму', () => {
    const r = extraLines(
      base,
      [
        ext({ price: 40 }),
        ext({ kind: 'offer', offer: 7, quantity: 2, price: 1 }),
        ext({ kind: 'discount', title: 'Промокод', price: 30, appliesTo: 1 }),
        ext({ kind: 'discount', title: 'День рождения', price: 20 }),
      ],
      catalog,
    );
    expect(r.ok && r.lines.map((l) => l.sum)).toEqual([40, 100, -30, -20]);
    expect(r.ok && r.lines[1]!.title).toBe('Корм');
    expect(r.ok && r.sum).toBe(90);
  });

  it('скидка больше строки или остатка заказа, чужая позиция, пустая строка - отказ', () => {
    expect(
      extraLines(base, [ext({ kind: 'discount', price: 101, appliesTo: 2 })], catalog),
    ).toEqual({ ok: false, error: 'discount_too_large' });
    expect(
      extraLines(
        base,
        [
          ext({ kind: 'discount', price: 300, appliesTo: 1 }),
          ext({ kind: 'discount', price: 101 }),
        ],
        catalog,
      ),
    ).toEqual({ ok: false, error: 'discount_too_large' });
    expect(extraLines(base, [ext({ kind: 'offer', offer: 99 })], catalog)).toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(extraLines(base, [ext({ title: '  ' })], catalog)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });
});

describe('акция на позиции', () => {
  const now = new Date('2026-10-23T12:00:00Z');
  it('акционная цена, пока идёт и ниже прайса; цена по прайсу рядом', () => {
    expect(currentPrice(1000, 800, null, now)).toEqual({ price: 800, listPrice: 1000 });
    expect(currentPrice(1000, 800, '2026-10-24T00:00:00Z', now)).toEqual({
      price: 800,
      listPrice: 1000,
    });
  });
  it('кончилась, не ниже прайса или без цены - обычная цена', () => {
    expect(currentPrice(1000, 800, '2026-10-22T00:00:00Z', now)).toEqual({
      price: 1000,
      listPrice: null,
    });
    expect(currentPrice(1000, 1000, null, now)).toEqual({ price: 1000, listPrice: null });
    expect(currentPrice(null, 800, null, now)).toEqual({ price: null, listPrice: null });
  });
  it('строка заказа несёт акционную цену и цену по прайсу', () => {
    const r = buildOrder(
      [{ offer: 1, quantity: 2 }],
      [
        {
          id: 1,
          title: 'Корм',
          price: 800,
          listPrice: 1000,
          stock: null,
          howToBuy: 'cart',
          deposit: null,
        },
      ],
    );
    expect(r.ok && [r.lines[0]!.price, r.lines[0]!.listPrice, r.total]).toEqual([800, 1000, 1600]);
  });
});

describe('с этим часто берут', () => {
  it('по числу совместных покупок, без самой позиции и чужих корзин', () => {
    const baskets = [
      [1, 2, 3],
      [1, 2],
      [1, 4],
      [5, 6],
      [1, 1, 3],
    ];
    expect(boughtTogether(baskets, 1, 2)).toEqual([2, 3]);
    expect(boughtTogether(baskets, 9, 4)).toEqual([]);
  });
});
