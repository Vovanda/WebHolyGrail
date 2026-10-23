import {
  type BuyerOrderSummary,
  type BuyerOrderView,
  isOverdue,
  type OfferDetailView,
  type OfferView,
} from 'contracts';

import type { MoneyPort, OfferCard, OfferDetailCard, StoredInvoice, StoredOrder } from './ports';

/**
 * Заказ глазами покупателя: только то, что он вправе видеть (И-8).
 *
 * @remarks
 * Собирается по полям явно: новое служебное поле (заметка менеджера, хэш
 * секрета) само в ответ не попадёт. Черновики счетов покупатель не видит.
 *
 * Суммы выходят `Money` по курсу на дату оформления заказа - она же дата
 * документа для его счетов (docs/adr/007-pricing-layers.md).
 */
/** Строка «Моих заказов»: итог по курсу на дату заказа, как и на его странице. */
export function toBuyerSummary(order: StoredOrder, money: MoneyPort): BuyerOrderSummary {
  return {
    id: String(order.id),
    status: order.status,
    createdAt: order.createdAt,
    total: money.at(order.total, new Date(order.createdAt)),
  };
}

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
      deposit: l.deposit === null ? null : out(l.deposit),
      removed: l.removed ?? null,
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
        purpose: i.purpose,
        status: i.status,
        overdue: isOverdue(i, now),
        dueAt: i.dueAt,
        total: out(i.total),
        lines: [
          ...i.lines.map((l) => ({
            title: l.title,
            quantity: l.quantity,
            price: out(l.price),
            sum: out(l.sum),
          })),
          // Скидка в учёте - вычет; покупателю её размер показывается с пометкой.
          ...i.extra.map((l) => ({
            title: l.title,
            quantity: l.quantity,
            price: out(l.price),
            sum: out(Math.abs(l.sum)),
            ...(l.kind === 'discount' ? { discount: true } : {}),
          })),
        ],
        voidReason: i.status === 'voided' ? i.voidReason : null,
      })),
    cancelReason: order.status === 'cancelled' ? order.cancelReason : null,
  };
}

/**
 * Позиция глазами покупателя: цена в валюте магазина по сегодняшнему курсу.
 *
 * @remarks
 * Нулевая цена выходит как «по запросу»: в заказ позиция без цены не идёт
 * (`buildOrder`), и витрина не должна предлагать положить её в корзину.
 */
export function toOfferView(card: OfferCard, money: MoneyPort, now: Date): OfferView {
  return {
    id: card.id,
    title: card.title,
    price: card.price === null || card.price <= 0 ? null : money.at(card.price, now),
    listPrice: card.listPrice === null ? null : money.at(card.listPrice, now),
    stock: card.stock,
    summary: card.summary,
    image: card.image,
    howToBuy: card.howToBuy,
    deposit: card.deposit === null ? null : money.at(card.deposit, now),
    slug: card.slug,
    section: card.section,
    specs: card.specs,
  };
}

/** Позиция для своей страницы: то же, что на витрине, плюс галерея, описание и раздел. */
export function toOfferDetailView(
  card: OfferDetailCard,
  money: MoneyPort,
  now: Date,
): OfferDetailView {
  return {
    ...toOfferView(card, money, now),
    gallery: card.gallery,
    description: card.description,
    sectionTitle: card.sectionTitle,
    characteristics: card.characteristics,
  };
}
