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
  stockMoves,
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

/**
 * Оформить заказ: цены из базы, заказ «новый» (И-1, И-2).
 *
 * @remarks
 * Остаток списывается у строк корзины; строки заявки остаток не держат, пока
 * заказ не приняли (`stockMoves`).
 */
export async function placeOrder(
  ports: ShopPorts,
  input: PlaceOrderInput,
): Promise<Outcome<StoredOrder>> {
  const checked = checkBuyer(input.buyer, (await ports.settings()).checkout);
  if (!checked.ok) return fail('invalid', checked.errors);

  return ports.transaction(async (tx) => {
    const offers = await tx.offers.snapshots(input.cart.map((l) => l.offer));
    const built = buildOrder(input.cart, offers);
    if (!built.ok) {
      if (built.tooLarge) return fail('invalid', { total: 'too_large' });
      return built.empty ? fail('empty') : fail('shortage', built.shortage);
    }

    // Проверка выше - для ответа покупателю; решает условная запись: остаток мог
    // уйти между чтением и списанием.
    const { take } = stockMoves(built.lines, null, 'new');
    const taken = await tx.offers.take(take);
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
      await tx.offers.giveBack(take);
      throw error;
    }
  });
}

/**
 * Перевести заказ действием участника.
 *
 * @remarks
 * Принятие списывает остаток строк заявки - не хватило, заказ остаётся новым.
 * Отмена возвращает то, что заказ держал, и закрывает счета. У отмены всегда
 * есть причина, покупатель видит её по ссылке: менеджер пишет её сам, без неё
 * отмены нет; за покупателя и систему она известна заранее.
 */
export async function changeOrder(
  ports: ShopPorts,
  id: Id,
  action: OrderAction,
  actor: Actor,
  reason?: string,
): Promise<Outcome<StoredOrder>> {
  return ports.transaction(async (tx) => {
    const order = await tx.orders.get(id);
    if (!order) return fail('not_found');
    if (!canOrder(order.status, action, actor)) return fail('forbidden');
    const cancelReason = action === 'cancel' ? reason?.trim() || CANCEL_REASON[actor] : undefined;
    if (action === 'cancel' && !cancelReason) return fail('reason_required');

    const to = ORDER_TRANSITIONS[action].to;
    const moves = stockMoves(order.lines, order.status, to);
    if (moves.take.length > 0) {
      const taken = await tx.offers.take(moves.take);
      if (!taken.ok) {
        const [now] = await tx.offers.snapshots([taken.offer]);
        return fail('shortage', [{ offer: taken.offer, available: Math.max(now?.stock ?? 0, 0) }]);
      }
    }
    if (to === 'cancelled') {
      const invoices = await tx.invoices.forOrder(order.id);
      // И-6: полученное по заказу сначала возвращается счётом-возвратом.
      if (heldAmount(invoices) !== 0) return fail('money_held');
      for (const invoice of invoices) {
        if (invoice.status === 'draft') await tx.invoices.remove(invoice.id);
        else if (INVOICE_OPEN.includes(invoice.status))
          await tx.invoices.update(invoice.id, { status: 'voided' });
      }
    }
    let switched: boolean;
    try {
      switched = await tx.orders.switchStatus(order.id, order.status, to, cancelReason);
    } catch (error) {
      // Транзакций в движке нет (#155): списанное при принятии возвращаем сами.
      if (moves.take.length > 0) await tx.offers.giveBack(moves.take);
      throw error;
    }
    if (!switched) {
      // Заказ уже перевёл другой процесс: остаток вернул он, наше списание - назад.
      if (moves.take.length > 0) await tx.offers.giveBack(moves.take);
      return fail('forbidden');
    }
    if (moves.giveBack.length > 0) await tx.offers.giveBack(moves.giveBack);
    return ok({ ...order, status: to, cancelReason: cancelReason ?? order.cancelReason });
  });
}

/** Причина отмены, которую участник не пишет сам; у менеджера её нет - он пишет свою. */
const CANCEL_REASON: Readonly<Record<Actor, string | undefined>> = {
  buyer: 'Отменён покупателем',
  system: 'Не принят вовремя',
  manager: undefined,
};

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
 * Отменяет новые заказы, которые не приняли за срок из настроек магазина.
 *
 * @remarks
 * Иначе оформленный ради шутки заказ держит штучную позицию вне витрины без
 * срока. Возвращает, сколько отменено; сбой одного заказа не останавливает
 * остальные - он попадёт в следующий проход.
 */
export async function cancelStaleOrders(ports: ShopPorts): Promise<number> {
  const { orderHoldHours } = await ports.settings();
  const before = new Date(ports.now().getTime() - orderHoldHours * 3_600_000);
  let cancelled = 0;
  for (const id of await ports.orders.newBefore(before)) {
    const result = await changeOrder(ports, id, 'cancel', 'system').catch(() => null);
    if (result?.ok) cancelled += 1;
  }
  return cancelled;
}
