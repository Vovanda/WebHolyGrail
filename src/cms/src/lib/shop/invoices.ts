import {
  type Actor,
  canInvoice,
  depositLines,
  type ExtraLine,
  type ExtraLineInput,
  extraLines,
  type InvoiceAction,
  type InvoicePurpose,
  INVOICE_TRANSITIONS,
  liveLines,
  type Micros,
  paymentPrice,
  refundable,
} from 'contracts';

import {
  fail,
  type Id,
  type InvoiceLine,
  ok,
  type Outcome,
  type ShopPorts,
  type StoredInvoice,
  type StoredOrder,
} from './ports';

/**
 * Сценарии счёта: собрать черновик, выставить, заявить и подтвердить оплату,
 * вернуть деньги.
 *
 * @remarks
 * Счёт всегда принадлежит заказу: покупатель видит его по секретной ссылке
 * заказа, другой ссылки у него нет. Переходы - таблица в contracts
 * (`canInvoice`); оплата и возврат меняют только состояния счетов
 * (docs/whg/43-shop.md, И-5).
 */

export interface DraftInput {
  /** Бронь или оплата позиций; по умолчанию оплата. */
  readonly purpose?: InvoicePurpose | undefined;
  /** Добавленные строки: доставка, позиция каталога, скидка. */
  readonly extra?: readonly ExtraLineInput[] | undefined;
  /** Пусто - срок встанет при выставлении по настройкам магазина. */
  readonly dueAt?: string | null | undefined;
}

/**
 * Строки счёта из заказа - копия живых строк, не правится (И-3).
 *
 * @remarks
 * Остаток списан по заказу, и счёт на другое количество или по другой цене развёл
 * бы заказ и деньги. Снятые строки в счёт не идут. Основной счёт после оплаченной
 * брони берёт цену минус бронь (`paymentPrice`).
 */
export function orderLinesFor(
  order: StoredOrder,
  purpose: InvoicePurpose,
  depositPaid: boolean,
): InvoiceLine[] {
  const live = liveLines(order.lines);
  if (purpose === 'deposit')
    return depositLines(live).map((l) => ({ ...l, sum: l.price * l.quantity }));
  return live.map((l) => {
    const price = paymentPrice(l, depositPaid);
    return { offer: l.offer, title: l.title, quantity: l.quantity, price, sum: price * l.quantity };
  });
}

/**
 * Добавленные строки черновика, сверенные со строками из заказа и ценами каталога.
 *
 * @remarks
 * Одно правило и для сценария, и для формы админки: у счёта на бронь добавленных
 * строк нет - бронь фиксированная часть цены, и основной счёт вычитает её целиком.
 */
export async function checkedExtra(
  tx: ShopPorts,
  invoice: { readonly purpose: InvoicePurpose; readonly lines: readonly InvoiceLine[] },
  input: readonly ExtraLineInput[],
): Promise<Outcome<{ extra: ExtraLine[]; sum: Micros; lines: InvoiceLine[] }>> {
  if (invoice.purpose === 'deposit' && input.length > 0) return fail('deposit_extra');
  const lines = invoice.lines;
  const offers = input.flatMap((l) => (l.kind === 'offer' && l.offer !== null ? [l.offer] : []));
  const catalog = new Map((await tx.offers.snapshots(offers)).map((o) => [o.id, o]));
  const r = extraLines(lines, input, (id) => {
    const o = catalog.get(id);
    return o && o.price !== null ? { title: o.title, price: o.price } : null;
  });
  if (!r.ok) return fail(r.error);
  return ok({
    extra: r.lines,
    sum: r.sum,
    lines: lines.map((l, k) => ({ ...l, discount: r.shares[k] ?? 0 })),
  });
}

const totalOf = (lines: readonly InvoiceLine[]): Micros => lines.reduce((t, l) => t + l.sum, 0);

/**
 * Черновик счёта к принятому заказу.
 *
 * @remarks
 * Счёт на бронь собирается из позиций с бронью, и у заказа он один, пока не
 * аннулирован; добавленных строк у него нет. Основной счёт - один живой на заказ (И-5).
 */
export async function createInvoice(
  ports: ShopPorts,
  orderId: Id,
  input: DraftInput = {},
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const order = await tx.orders.get(orderId);
    if (!order) return fail('not_found');
    if (order.status !== 'accepted') return fail('forbidden');
    const purpose = input.purpose ?? 'payment';
    const live = (await tx.invoices.forOrder(order.id)).filter(
      (i) => i.kind === 'invoice' && i.status !== 'voided',
    );
    if (live.some((i) => i.purpose === purpose)) return fail('forbidden');
    // Цена минус бронь - только после оплаченной брони: неоплаченную можно удалить
    // или аннулировать, и покупатель не заплатил бы её вовсе.
    const depositPaid = live.some((i) => i.purpose === 'deposit' && i.status === 'paid');
    const lines = orderLinesFor(order, purpose, depositPaid);
    if (lines.length === 0) return fail('invalid');
    const extra = await checkedExtra(tx, { purpose, lines }, input.extra ?? []);
    if (!extra.ok) return extra;
    return ok(
      await tx.invoices.create({
        order: order.id,
        kind: 'invoice',
        purpose,
        status: 'draft',
        refundOf: null,
        lines: extra.value.lines,
        extra: extra.value.extra,
        total: totalOf(lines) + extra.value.sum,
        dueAt: input.dueAt ?? null,
        voidReason: null,
      }),
    );
  });
}

/** Правка черновика: добавленные строки и срок. Строки из заказа не меняются (И-3). */
export async function updateDraft(
  ports: ShopPorts,
  id: Id,
  input: DraftInput,
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const invoice = await tx.invoices.get(id);
    if (!invoice || invoice.order === null) return fail('not_found');
    if (invoice.status !== 'draft' || invoice.kind !== 'invoice') return fail('forbidden');
    const extra = await checkedExtra(tx, invoice, input.extra ?? invoice.extra);
    if (!extra.ok) return extra;
    const patch = {
      lines: extra.value.lines,
      extra: extra.value.extra,
      total: totalOf(invoice.lines) + extra.value.sum,
      dueAt: input.dueAt === undefined ? invoice.dueAt : input.dueAt,
    };
    await tx.invoices.update(id, patch);
    return ok({ ...invoice, ...patch });
  });
}

/** Черновик удаляется, а не аннулируется: номера у него ещё нет. */
export async function deleteDraft(ports: ShopPorts, id: Id): Promise<Outcome<null>> {
  return ports.transaction(async (tx) => {
    const invoice = await tx.invoices.get(id);
    if (!invoice) return fail('not_found');
    if (invoice.status !== 'draft') return fail('forbidden');
    await tx.invoices.remove(id);
    return ok(null);
  });
}

/**
 * Черновик счёта-возврата к оплаченному счёту.
 *
 * @remarks
 * Возврат - это сумма: деньги возвращают частями, пока сумма живых возвратов
 * не дойдёт до суммы счёта (`refundable`).
 */
export async function createRefund(
  ports: ShopPorts,
  invoiceId: Id,
  input: { amount?: Micros | undefined } = {},
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const source = await tx.invoices.get(invoiceId);
    if (!source || source.order === null) return fail('not_found');
    if (source.kind !== 'invoice' || source.status !== 'paid') return fail('forbidden');
    const siblings = await tx.invoices.forOrder(source.order);
    const left = refundable(source.total, refundsOf(siblings, source.id));
    if (left <= 0) return fail('forbidden');
    const amount = input.amount === undefined ? left : Math.round(Number(input.amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > left) return fail('invalid');
    return ok(
      await tx.invoices.create({
        order: source.order,
        kind: 'refund',
        purpose: 'payment',
        status: 'draft',
        refundOf: source.id,
        lines: [
          {
            offer: null,
            title: `Возврат по счёту № ${source.id}`,
            quantity: 1,
            price: amount,
            sum: amount,
          },
        ],
        extra: [],
        total: amount,
        voidReason: null,
        dueAt: null,
      }),
    );
  });
}

const refundsOf = (invoices: readonly StoredInvoice[], id: Id) =>
  invoices.filter((i) => i.kind === 'refund' && String(i.refundOf) === String(id));

/** Перевести счёт действием участника. */
export async function changeInvoice(
  ports: ShopPorts,
  id: Id,
  action: InvoiceAction,
  actor: Actor,
  reason?: string,
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const invoice = await tx.invoices.get(id);
    if (!invoice) return fail('not_found');
    if (!canInvoice(invoice.status, action, actor, invoice.kind)) return fail('forbidden');
    // Аннулирование - с причиной (И-9): у менеджера своя, отказ покупателя известен заранее.
    const voidReason =
      action === 'decline'
        ? DECLINED
        : action === 'void'
          ? reason?.trim().slice(0, 200)
          : undefined;
    if (action === 'void' && !voidReason) return fail('reason_required');

    const to = INVOICE_TRANSITIONS[action].to;
    const patch: { status: typeof to; voidReason?: string; dueAt?: string } = { status: to };
    if (voidReason) patch.voidReason = voidReason;
    // Срок оплаты считается от выставления: черновик мог пролежать несколько дней.
    if (action === 'issue' && invoice.dueAt === null && invoice.kind === 'invoice') {
      const { invoiceDueDays } = await tx.settings();
      if (invoiceDueDays > 0)
        patch.dueAt = new Date(tx.now().getTime() + invoiceDueDays * 86_400_000).toISOString();
    }
    await tx.invoices.update(id, patch);
    return ok({ ...invoice, ...patch });
  });
}

const DECLINED = 'Покупатель отказался';

/** Действие покупателя со счётом своего заказа по секретной ссылке (И-7). */
async function bySecret(
  ports: ShopPorts,
  secretHash: string,
  invoiceId: Id,
  action: 'report' | 'decline',
): Promise<Outcome<StoredInvoice>> {
  const order = await ports.orders.bySecretHash(secretHash);
  const invoice = order ? await ports.invoices.get(invoiceId) : null;
  if (!order || !invoice || String(invoice.order) !== String(order.id)) return fail('not_found');
  return changeInvoice(ports, invoiceId, action, 'buyer');
}

/** «Я оплатил» от покупателя. */
export const reportBySecret = (
  ports: ShopPorts,
  secretHash: string,
  invoiceId: Id,
): Promise<Outcome<StoredInvoice>> => bySecret(ports, secretHash, invoiceId, 'report');

/** Покупатель отказался от выставленного счёта: счёт аннулируется с причиной. */
export const declineBySecret = (
  ports: ShopPorts,
  secretHash: string,
  invoiceId: Id,
): Promise<Outcome<StoredInvoice>> => bySecret(ports, secretHash, invoiceId, 'decline');
