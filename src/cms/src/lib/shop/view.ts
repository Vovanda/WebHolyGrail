import { type BuyerOrderView, isOverdue, type OfferView } from 'contracts';

import type { MoneyPort, OfferCard, StoredInvoice, StoredOrder } from './ports';

/**
 * Заказ глазами покупателя: только то, что он вправе видеть (И-8).
 *
 * @remarks
 * Собирается по полям явно: новое служебное поле (заметка менеджера, хэш
 * секрета, номера кодов в базе) само в ответ не попадёт. Черновики счетов
 * покупатель не видит; коды - только у оплаченного счёта.
 *
 * Суммы выходят `Money` по курсу на дату оформления заказа - она же дата
 * документа для его счетов (docs/adr/007-pricing-layers.md).
 */
export function toBuyerView(
  order: StoredOrder,
  invoices: readonly StoredInvoice[],
  now: Date,
  money: MoneyPort,
): BuyerOrderView {
  const placed = new Date(order.createdAt);
  const out = (amount: number) => money.at(amount, placed);
  return {
    id: String(order.id),
    status: order.status,
    createdAt: order.createdAt,
    total: out(order.total),
    lines: order.lines.map((l) => ({
      offer: l.offer,
      title: l.title,
      quantity: l.quantity,
      price: out(l.price),
      sum: out(l.sum),
      mode: l.mode,
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
        total: out(i.total),
        lines: i.lines.map((l) => ({
          title: l.title,
          quantity: l.quantity,
          price: out(l.price),
          sum: out(l.sum),
        })),
        codes: i.status === 'paid' && i.kind === 'invoice' ? i.codes.map((c) => c.code) : [],
      })),
  };
}

/** Позиция глазами покупателя: цена в валюте магазина по сегодняшнему курсу. */
export function toOfferView(card: OfferCard, money: MoneyPort, now: Date): OfferView {
  return {
    id: card.id,
    title: card.title,
    price: card.price === null ? null : money.at(card.price, now),
    stock: card.stock,
    summary: card.summary,
    image: card.image,
    howToBuy: card.howToBuy,
  };
}
