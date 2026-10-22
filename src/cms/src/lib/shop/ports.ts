import type {
  InvoiceKind,
  InvoicePurpose,
  InvoiceStatus,
  HowToBuy,
  Micros,
  Money,
  OfferSnapshot,
  OrderLine,
  OrderStatus,
  ShopSettings,
} from 'contracts';

/**
 * Порты магазина: что сценариям нужно от хранилища и соседних модулей.
 *
 * @remarks
 * Сценарии (`orders.ts`, `invoices.ts`) знают только эти интерфейсы. Payload
 * живёт в адаптере (`payload-store.ts`), в тестах его место занимает память
 * (`memory-store.ts`). Заменить CMS - переписать адаптер; правила не трогаются
 * (docs/whg/43-shop.md, «Слои»).
 */

export type Id = string | number;

export interface Buyer {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly comment: string;
}

export interface StoredOrder {
  readonly id: Id;
  readonly status: OrderStatus;
  readonly lines: readonly OrderLine[];
  readonly total: Micros;
  readonly buyer: Buyer;
  /** Хэш секрета ссылки заказа; сам секрет знает только покупатель. */
  readonly secretHash: string;
  readonly createdAt: string;
}

export interface InvoiceLine {
  /** Позиция каталога; у свободной строки (доставка, наценка) - null. */
  readonly offer: number | null;
  readonly title: string;
  readonly quantity: number;
  readonly price: Micros;
  readonly sum: Micros;
  readonly access: number | null;
}

/** Код доступа, выданный по строке оплаченного счёта. */
export interface IssuedCode {
  readonly line: number;
  readonly codeId: Id;
  readonly code: string;
}

export interface StoredInvoice {
  readonly id: Id;
  readonly order: Id | null;
  readonly kind: InvoiceKind;
  /** У счёта на оплату - бронь или оплата позиций; у возврата всегда «оплата». */
  readonly purpose: InvoicePurpose;
  readonly status: InvoiceStatus;
  /** Счёт, который возвращает возврат. */
  readonly refundOf: Id | null;
  readonly lines: readonly InvoiceLine[];
  readonly total: Micros;
  readonly dueAt: string | null;
  readonly codes: readonly IssuedCode[];
}

/** Позиция для витрины и корзины: то, что показывают покупателю, цена - в учёте. */
export interface OfferCard {
  readonly id: number;
  readonly title: string;
  readonly price: Micros | null;
  readonly stock: number | null;
  readonly summary: string | null;
  /** Картинка как её отдаёт хранилище - сайт показывает её своим примитивом. */
  readonly image: unknown;
  readonly howToBuy: HowToBuy;
  readonly deposit: Micros | null;
}

/** Какие позиции показать: выбранные по номерам либо первые `limit` по названию. */
export type OfferQuery = { readonly ids: readonly number[] } | { readonly limit: number };

export interface OfferPort {
  snapshots(ids: readonly number[]): Promise<OfferSnapshot[]>;
  cards(query: OfferQuery): Promise<OfferCard[]>;
  /**
   * Списывает остаток условной записью; не хватило на строке - возвращает
   * уже списанное и называет её (lib/shop/stock.ts).
   */
  take(
    lines: readonly { offer: number; quantity: number }[],
  ): Promise<{ ok: true } | { ok: false; offer: number }>;
  /** Возвращает остаток - при отмене заказа. */
  giveBack(lines: readonly { offer: number; quantity: number }[]): Promise<void>;
}

export interface OrderPort {
  create(order: Omit<StoredOrder, 'id' | 'createdAt'>): Promise<StoredOrder>;
  get(id: Id): Promise<StoredOrder | null>;
  bySecretHash(hash: string): Promise<StoredOrder | null>;
  /**
   * Переводит заказ из `from` в `to`, только если он всё ещё в `from`.
   *
   * @remarks
   * Условная запись, как у остатка: два процесса, отменяющие один заказ, не
   * вернут остаток дважды - второй получит `false`.
   */
  switchStatus(id: Id, from: OrderStatus, to: OrderStatus): Promise<boolean>;
  /** Новые заказы, оформленные раньше `before`. */
  newBefore(before: Date): Promise<Id[]>;
}

export interface InvoicePort {
  forOrder(order: Id): Promise<StoredInvoice[]>;
  get(id: Id): Promise<StoredInvoice | null>;
  create(invoice: Omit<StoredInvoice, 'id'>): Promise<StoredInvoice>;
  update(id: Id, patch: Partial<Omit<StoredInvoice, 'id'>>): Promise<void>;
  remove(id: Id): Promise<void>;
}

/** Выдача доступа к видео кодом - механизм движка (docs/whg/41-access.md). */
export interface AccessPort {
  issue(access: number): Promise<{ codeId: Id; code: string }>;
  /** Отзывает код и права, открытые по нему (право хранит значение кода). */
  revoke(code: { codeId: Id; code: string }): Promise<void>;
}

/**
 * Деньги наружу: сумма учёта → `Money` в валюте магазина по курсу на дату
 * документа (docs/adr/003-currencies.md). Внутри модуля сумм в `Money` нет.
 */
export interface MoneyPort {
  at(amount: Micros, date: Date): Money;
  /** Обратно в учёт; сумма не в валюте магазина - null. */
  back(money: Money, date: Date): Micros | null;
}

export interface ShopPorts {
  readonly offers: OfferPort;
  readonly orders: OrderPort;
  readonly invoices: InvoicePort;
  readonly access: AccessPort;
  readonly money: MoneyPort;
  /** Настройки магазина владельца: сроки и анкета (`shopSettings` с умолчаниями). */
  settings(): Promise<ShopSettings>;
  readonly now: () => Date;
  /** Всё внутри - одна транзакция: либо целиком, либо ничего. */
  transaction<T>(work: (ports: ShopPorts) => Promise<T>): Promise<T>;
}

export type Failure =
  | 'not_found'
  | 'forbidden'
  | 'invalid'
  | 'empty'
  | 'shortage'
  | 'money_held'
  | 'quantity_locked';

export type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Failure; readonly detail?: unknown };

export const ok = <T>(value: T): Outcome<T> => ({ ok: true, value });
export const fail = (error: Failure, detail?: unknown): Outcome<never> =>
  detail === undefined ? { ok: false, error } : { ok: false, error, detail };
