import {
  type Actor,
  buildOrder,
  canOrder,
  type CartLine,
  checkBuyer,
  heldAmount,
  INVOICE_OPEN,
  type OrderAction,
  ORDER_TRANSITIONS,
  STALE_ORDER_HOURS,
} from 'contracts';

import { fail, type Id, ok, type Outcome, type ShopPorts, type StoredOrder } from './ports';

/**
 * Сценарии заказа: оформить, принять, выполнить, отменить.
 *
 * @remarks
 * Правила переходов - таблица в contracts (`canOrder`); здесь только порядок
 * шагов и что они трогают. Каждый сценарий - одна транзакция: остаток,
 * заказ и его счета меняются вместе или никак (docs/whg/43-shop.md, И-2, И-6).
 */

export interface PlaceOrderInput {
  readonly cart: readonly CartLine[];
  readonly buyer: Record<string, unknown>;
  /** Хэш секрета ссылки заказа; сам секрет отдаётся покупателю в ответе. */
  readonly secretHash: string;
}

/** Оформить заказ: цены из базы, остаток списан, заказ «новый» (И-1, И-2). */
export async function placeOrder(
  ports: ShopPorts,
  input: PlaceOrderInput,
): Promise<Outcome<StoredOrder>> {
  const checked = checkBuyer(input.buyer);
  if (!checked.ok) return fail('invalid', checked.errors);

  return ports.transaction(async (tx) => {
    const offers = await tx.offers.snapshots(input.cart.map((l) => l.offer));
    const built = buildOrder(input.cart, offers);
    if (!built.ok) return built.empty ? fail('empty') : fail('shortage', built.shortage);

    // Проверка выше - для ответа покупателю; решает условная запись: остаток мог
    // уйти между чтением и списанием.
    const taken = await tx.offers.take(built.lines);
    if (!taken.ok) {
      const [now] = await tx.offers.snapshots([taken.offer]);
      return fail('shortage', [{ offer: taken.offer, available: Math.max(now?.stock ?? 0, 0) }]);
    }
    try {
      const order = await tx.orders.create({
        status: 'new',
        lines: built.lines,
        total: built.total,
        buyer: checked.buyer,
        secretHash: input.secretHash,
      });
      return ok(order);
    } catch (error) {
      // Транзакций в движке нет (#155): списанное без заказа возвращаем сами.
      await tx.offers.giveBack(built.lines);
      throw error;
    }
  });
}

/** Перевести заказ действием участника; отмена возвращает остаток и закрывает счета. */
export async function changeOrder(
  ports: ShopPorts,
  id: Id,
  action: OrderAction,
  actor: Actor,
): Promise<Outcome<StoredOrder>> {
  return ports.transaction(async (tx) => {
    const order = await tx.orders.get(id);
    if (!order) return fail('not_found');
    if (!canOrder(order.status, action, actor)) return fail('forbidden');

    const to = ORDER_TRANSITIONS[action].to;
    if (to === 'cancelled') {
      const invoices = await tx.invoices.forOrder(order.id);
      // И-6: полученное по заказу сначала возвращается счётом-возвратом.
      if (heldAmount(invoices) !== 0) return fail('money_held');
      for (const invoice of invoices) {
        if (invoice.status === 'draft') await tx.invoices.remove(invoice.id);
        else if (INVOICE_OPEN.includes(invoice.status))
          await tx.invoices.update(invoice.id, { status: 'voided' });
      }
      await tx.offers.giveBack(order.lines);
    }
    await tx.orders.setStatus(order.id, to);
    return ok({ ...order, status: to });
  });
}

/** Покупатель отменяет свой новый заказ по секретной ссылке (И-7). */
export async function cancelBySecret(
  ports: ShopPorts,
  secretHash: string,
): Promise<Outcome<StoredOrder>> {
  const order = await ports.orders.bySecretHash(secretHash);
  if (!order) return fail('not_found');
  return changeOrder(ports, order.id, 'cancel', 'buyer');
}

/**
 * Отменяет новые заказы, которые не приняли за {@link STALE_ORDER_HOURS} часов.
 *
 * @remarks
 * Иначе оформленный ради шутки заказ держит штучную позицию вне витрины без
 * срока. Возвращает, сколько отменено; сбой одного заказа не останавливает
 * остальные - он попадёт в следующий проход.
 */
export async function cancelStaleOrders(ports: ShopPorts): Promise<number> {
  const before = new Date(ports.now().getTime() - STALE_ORDER_HOURS * 3_600_000);
  let cancelled = 0;
  for (const id of await ports.orders.newBefore(before)) {
    const result = await changeOrder(ports, id, 'cancel', 'system').catch(() => null);
    if (result?.ok) cancelled += 1;
  }
  return cancelled;
}
