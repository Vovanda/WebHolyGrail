import {
  type Actor,
  canInvoice,
  fullyRefunded,
  type InvoiceAction,
  INVOICE_TRANSITIONS,
  type Micros,
  refundable,
} from 'contracts';

import {
  fail,
  type Id,
  type InvoiceLine,
  type IssuedCode,
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
 * (`canInvoice`); оплата выдаёт коды доступа по строкам, оплаченный возврат
 * их отзывает (docs/whg/43-shop.md, И-5).
 */

export interface LineInput {
  readonly offer: number | null;
  readonly title: string;
  readonly quantity: number;
  readonly price: Micros;
}

export interface DraftInput {
  /** Пусто - строки копируются из заказа. */
  readonly lines?: readonly LineInput[] | undefined;
  readonly dueAt?: string | null | undefined;
}

const MAX_LINES = 100;

/**
 * Строки счёта из ввода менеджера, сверенные с заказом (И-3).
 *
 * @remarks
 * У строки с позицией каталога количество берётся из заказа: остаток списан по
 * заказу, и счёт на другое количество развёл бы их. Цену менеджер правит -
 * доставку и курс сайт не знает. Свободная строка (доставка) пишется как угодно.
 * Позиция заказа встречается в счёте один раз: повтор удвоил бы сумму и коды
 * доступа за одну покупку.
 */
export function draftLines(
  order: StoredOrder,
  input: readonly LineInput[] | undefined,
): Outcome<InvoiceLine[]> {
  const fromOrder = new Map(order.lines.map((l) => [l.offer, l]));
  const source: readonly LineInput[] =
    input ??
    order.lines.map((l) => ({
      offer: l.offer,
      title: l.title,
      quantity: l.quantity,
      price: l.price,
    }));
  if (source.length === 0 || source.length > MAX_LINES) return fail('invalid');

  const lines: InvoiceLine[] = [];
  const seen = new Set<number>();
  for (const l of source) {
    const price = Math.round(Number(l.price));
    const quantity = Math.floor(Number(l.quantity));
    const title = String(l.title ?? '').trim();
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      !title
    ) {
      return fail('invalid');
    }
    if (l.offer !== null) {
      const ordered = fromOrder.get(l.offer);
      if (!ordered || seen.has(l.offer)) return fail('invalid');
      seen.add(l.offer);
      if (quantity !== ordered.quantity) return fail('quantity_locked', { offer: l.offer });
      lines.push({
        offer: l.offer,
        title,
        quantity,
        price,
        sum: price * quantity,
        access: ordered.access,
      });
    } else {
      lines.push({
        offer: null,
        title: title.slice(0, 200),
        quantity,
        price,
        sum: price * quantity,
        access: null,
      });
    }
  }
  return ok(lines);
}

const totalOf = (lines: readonly InvoiceLine[]): Micros => lines.reduce((t, l) => t + l.sum, 0);

/** Черновик счёта к принятому заказу. */
export async function createInvoice(
  ports: ShopPorts,
  orderId: Id,
  input: DraftInput = {},
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const order = await tx.orders.get(orderId);
    if (!order) return fail('not_found');
    if (order.status !== 'accepted') return fail('forbidden');
    const lines = draftLines(order, input.lines);
    if (!lines.ok) return lines;
    return ok(
      await tx.invoices.create({
        order: order.id,
        kind: 'invoice',
        status: 'draft',
        refundOf: null,
        lines: lines.value,
        total: totalOf(lines.value),
        dueAt: input.dueAt ?? null,
        codes: [],
      }),
    );
  });
}

/** Правка черновика: строки и срок. Выставленный счёт не меняется (И-3). */
export async function updateDraft(
  ports: ShopPorts,
  id: Id,
  input: DraftInput,
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const invoice = await tx.invoices.get(id);
    if (!invoice || invoice.order === null) return fail('not_found');
    if (invoice.status !== 'draft' || invoice.kind !== 'invoice') return fail('forbidden');
    const order = await tx.orders.get(invoice.order);
    if (!order) return fail('not_found');
    const lines = draftLines(order, input.lines);
    if (!lines.ok) return lines;
    const patch = {
      lines: lines.value,
      total: totalOf(lines.value),
      dueAt: input.dueAt ?? invoice.dueAt,
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
 * не дойдёт до суммы счёта (`refundable`). Доступ к видео отзывает только
 * полный возврат (`fullyRefunded`), часть денег за курс курс не отнимает.
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
        status: 'draft',
        refundOf: source.id,
        lines: [
          {
            offer: null,
            title: `Возврат по счёту № ${source.id}`,
            quantity: 1,
            price: amount,
            sum: amount,
            access: null,
          },
        ],
        total: amount,
        dueAt: null,
        codes: [],
      }),
    );
  });
}

const refundsOf = (invoices: readonly StoredInvoice[], id: Id) =>
  invoices.filter((i) => i.kind === 'refund' && String(i.refundOf) === String(id));

/** Коды доступа по строкам оплаченного счёта: по коду на каждую единицу строки с доступом. */
async function issueCodes(ports: ShopPorts, invoice: StoredInvoice): Promise<IssuedCode[]> {
  const codes: IssuedCode[] = [];
  for (const [line, l] of invoice.lines.entries()) {
    if (l.access === null) continue;
    for (let n = 0; n < l.quantity; n += 1) {
      const { codeId, code } = await ports.access.issue(l.access);
      codes.push({ line, codeId, code });
    }
  }
  return codes;
}

/** После оплаченного возврата: деньги за счёт вернули целиком - коды отзываются все. */
async function revokeIfFullyRefunded(ports: ShopPorts, refund: StoredInvoice): Promise<void> {
  if (refund.refundOf === null) return;
  const source = await ports.invoices.get(refund.refundOf);
  if (!source || source.order === null) return;
  const refunds = refundsOf(await ports.invoices.forOrder(source.order), source.id).map((r) =>
    String(r.id) === String(refund.id) ? { ...r, status: 'paid' as const } : r,
  );
  if (!fullyRefunded(source.total, refunds)) return;
  for (const c of source.codes) await ports.access.revoke(c);
  await ports.invoices.update(source.id, { codes: [] });
}

/** Перевести счёт действием участника. */
export async function changeInvoice(
  ports: ShopPorts,
  id: Id,
  action: InvoiceAction,
  actor: Actor,
): Promise<Outcome<StoredInvoice>> {
  return ports.transaction(async (tx) => {
    const invoice = await tx.invoices.get(id);
    if (!invoice) return fail('not_found');
    if (!canInvoice(invoice.status, action, actor, invoice.kind)) return fail('forbidden');

    const to = INVOICE_TRANSITIONS[action].to;
    const patch: { status: typeof to; codes?: IssuedCode[] } = { status: to };
    if (to === 'paid' && invoice.kind === 'invoice') patch.codes = await issueCodes(tx, invoice);
    if (to === 'paid' && invoice.kind === 'refund') await revokeIfFullyRefunded(tx, invoice);
    await tx.invoices.update(id, patch);
    return ok({ ...invoice, ...patch });
  });
}

/** «Я оплатил» от покупателя по секретной ссылке: только счёт своего заказа (И-7). */
export async function reportBySecret(
  ports: ShopPorts,
  secretHash: string,
  invoiceId: Id,
): Promise<Outcome<StoredInvoice>> {
  const order = await ports.orders.bySecretHash(secretHash);
  const invoice = order ? await ports.invoices.get(invoiceId) : null;
  if (!order || !invoice || String(invoice.order) !== String(order.id)) return fail('not_found');
  return changeInvoice(ports, invoiceId, 'report', 'buyer');
}
