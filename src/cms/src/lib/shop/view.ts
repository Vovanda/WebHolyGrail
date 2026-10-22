import { type BuyerOrderView, isOverdue } from 'contracts';

import type { StoredInvoice, StoredOrder } from './ports';

/**
 * Заказ глазами покупателя: только то, что он вправе видеть (И-8).
 *
 * @remarks
 * Собирается по полям явно: новое служебное поле (заметка менеджера, хэш
 * секрета, номера кодов в базе) само в ответ не попадёт. Черновики счетов
 * покупатель не видит; коды - только у оплаченного счёта.
 */
export function toBuyerView(
  order: StoredOrder,
  invoices: readonly StoredInvoice[],
  now: Date,
): BuyerOrderView {
  return {
    id: String(order.id),
    status: order.status,
    createdAt: order.createdAt,
    total: order.total,
    lines: order.lines.map((l) => ({
      offer: l.offer,
      title: l.title,
      quantity: l.quantity,
      price: l.price,
      sum: l.sum,
    })),
    buyer: {
      name: order.buyer.name,
      phone: order.buyer.phone,
      email: order.buyer.email,
      comment: order.buyer.comment,
    },
    invoices: invoices
      .filter((i) => i.status !== 'draft')
      .map((i) => ({
        id: String(i.id),
        kind: i.kind,
        status: i.status,
        overdue: isOverdue(i, now),
        dueAt: i.dueAt,
        total: i.total,
        lines: i.lines.map((l) => ({
          title: l.title,
          quantity: l.quantity,
          price: l.price,
          sum: l.sum,
        })),
        codes: i.status === 'paid' && i.kind === 'invoice' ? i.codes.map((c) => c.code) : [],
      })),
  };
}
