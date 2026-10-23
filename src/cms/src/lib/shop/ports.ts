import type {
  CatalogSectionSummary,
  CatalogSectionView,
  Characteristic,
  ExtraLine,
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
  SpecValue,
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
  /** Почему отменён; ставится в том же переходе, что и «отменён». */
  readonly cancelReason: string | null;
}

export interface InvoiceLine {
  /** Позиция каталога; у свободной строки (доставка, наценка) - null. */
  readonly offer: number | null;
  readonly title: string;
  readonly quantity: number;
  readonly price: Micros;
  readonly sum: Micros;
  /** Доля скидок счёта на эту строку (ADR-007); у строк без скидки 0. */
  readonly discount?: Micros;
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
  /** Строки из заказа: копия живых строк, не правится. */
  readonly lines: readonly InvoiceLine[];
  /** Добавленные строки: доставка, позиция каталога, скидка. */
  readonly extra: readonly ExtraLine[];
  readonly total: Micros;
  readonly dueAt: string | null;
  /** Почему аннулирован: пишет менеджер или «покупатель отказался». */
  readonly voidReason: string | null;
}

/** Позиция для витрины и корзины: то, что показывают покупателю, цена - в учёте. */
export interface OfferCard {
  readonly id: number;
  readonly title: string;
  readonly price: Micros | null;
  /** Цена по прайсу, пока идёт акция; без акции пусто. */
  readonly listPrice: Micros | null;
  /** Артикул продавца. */
  readonly sku: string | null;
  readonly stock: number | null;
  readonly summary: string | null;
  /** Картинка как её отдаёт хранилище - сайт показывает её своим примитивом. */
  readonly image: unknown;
  readonly howToBuy: HowToBuy;
  readonly deposit: Micros | null;
  readonly slug: string | null;
  /** Слаг раздела каталога. */
  readonly section: string | null;
  readonly specs: Readonly<Record<string, SpecValue>>;
}

/** Позиция в индексе каталога: карточка и время создания - для сортировки «новинки». */
export interface CatalogCard extends OfferCard {
  readonly createdAt: string;
  /** Конец акции; после него цена другая, и индекс пересобирается. */
  readonly promoUntil: string | null;
}

/** Всё, из чего строится индекс каталога. */
export interface CatalogData {
  readonly cards: readonly CatalogCard[];
  readonly sections: readonly CatalogSectionView[];
}

/** Позиция для своей страницы: карточка плюс галерея, описание и раздел целиком. */
export interface OfferDetailCard extends OfferCard {
  readonly gallery: readonly unknown[];
  readonly description: unknown;
  readonly sectionTitle: string | null;
  readonly characteristics: readonly Characteristic[];
}

/** Потолок позиций в разделе: раздел читается целиком, но не бесконечно. */
export const SECTION_CAP = 2000;

/** Сколько найденных позиций отдаёт поиск: столько видно в выпадающем списке. */
export const SEARCH_LIMIT = 8;

/**
 * Какие позиции показать: выбранные по номерам, раздел каталога целиком
 * (до `SECTION_CAP`), найденные по запросу (лучшие `SEARCH_LIMIT`) либо первые
 * `limit` по названию.
 */
export type OfferQuery =
  | { readonly ids: readonly number[] }
  | { readonly section: string }
  | { readonly search: string }
  | { readonly limit: number };

export interface OfferPort {
  snapshots(ids: readonly number[]): Promise<OfferSnapshot[]>;
  cards(query: OfferQuery): Promise<OfferCard[]>;
  /** Позиция по слагу её страницы; нет такой - null. */
  detail(slug: string): Promise<OfferDetailCard | null>;
  /** Раздел каталога по слагу; нет такого - null. */
  section(slug: string): Promise<CatalogSectionView | null>;
  /**
   * Списывает остаток условной записью; не хватило на строке - возвращает
   * уже списанное и называет её (lib/shop/stock.ts).
   */
  take(
    lines: readonly { offer: number; quantity: number }[],
  ): Promise<{ ok: true } | { ok: false; offer: number }>;
  /** Возвращает остаток - при отмене заказа. */
  giveBack(lines: readonly { offer: number; quantity: number }[]): Promise<void>;
  /** Разделы каталога со счётом позиций - для страницы `/shop`; пустые не отдаются. */
  sections(): Promise<CatalogSectionSummary[]>;
  /** Все позиции и разделы для индекса каталога, в порядке «по умолчанию». */
  catalog(): Promise<CatalogData>;
  /**
   * Версия данных каталога: меняется при любой правке позиций и разделов.
   *
   * @remarks
   * Индекс сверяется с ней перед ответом: экземпляров CMS бывает несколько,
   * и хук правки в одном не обновит память другого.
   */
  catalogVersion(): Promise<string>;
}

export interface OrderPort {
  create(order: Omit<StoredOrder, 'id' | 'createdAt' | 'cancelReason'>): Promise<StoredOrder>;
  get(id: Id): Promise<StoredOrder | null>;
  bySecretHash(hash: string): Promise<StoredOrder | null>;
  /**
   * Переводит заказ из `from` в `to`, только если он всё ещё в `from`.
   *
   * @remarks
   * Условная запись, как у остатка: два процесса, отменяющие один заказ, не
   * вернут остаток дважды - второй получит `false`.
   */
  switchStatus(id: Id, from: OrderStatus, to: OrderStatus, cancelReason?: string): Promise<boolean>;
  /**
   * Помечает строку `index` снятой и пишет новый итог - только если заказ всё ещё
   * в `status`, а строка ещё не снята.
   *
   * @remarks
   * Условная запись: два снятия одной строки не вернут её остаток дважды.
   */
  removeLine(
    id: Id,
    index: number,
    status: OrderStatus,
    reason: string,
    total: Micros,
  ): Promise<boolean>;
  /** Новые заказы, оформленные раньше `before`. */
  newBefore(before: Date): Promise<Id[]>;
  /** Позиции недавних неотменённых заказов, где была `offer`: по корзине на заказ, без снятых строк. */
  basketsWith(offer: number, limit: number): Promise<number[][]>;
}

export interface InvoicePort {
  forOrder(order: Id): Promise<StoredInvoice[]>;
  get(id: Id): Promise<StoredInvoice | null>;
  create(invoice: Omit<StoredInvoice, 'id'>): Promise<StoredInvoice>;
  update(id: Id, patch: Partial<Omit<StoredInvoice, 'id'>>): Promise<void>;
  remove(id: Id): Promise<void>;
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
  | 'quantity_locked'
  | 'reason_required'
  | 'discount_too_large'
  | 'last_line'
  | 'invoice_exists'
  | 'deposit_extra';

export type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: Failure; readonly detail?: unknown };

export const ok = <T>(value: T): Outcome<T> => ({ ok: true, value });
export const fail = (error: Failure, detail?: unknown): Outcome<never> =>
  detail === undefined ? { ok: false, error } : { ok: false, error, detail };
