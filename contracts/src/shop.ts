/**
 * Магазин: автоматы заказа и счёта (docs/whg/43-shop.md).
 *
 * @remarks
 * Переходы - только здесь. Коллекции, ручки и кнопки админки спрашивают эту
 * таблицу, своих правил «откуда куда» не держат: иначе правило живёт в трёх
 * местах и расходится.
 *
 * Участник - роль, а не человек: покупатель узнаётся по секретной ссылке
 * заказа, менеджер - редактор, система - плановая задача или уведомление
 * платёжного сервиса.
 *
 * Деньги внутри - целые микроединицы основной валюты учёта (`Micros`); наружу,
 * в то, что видит сайт, они выходят только объектом `Money` (docs/adr/002-money.md).
 */

import type { Micros, Money } from './money';

export type Actor = 'buyer' | 'manager' | 'system';

export type OrderStatus = 'new' | 'accepted' | 'done' | 'cancelled';
export type OrderAction = 'accept' | 'complete' | 'cancel';

/**
 * Счёт на оплату или счёт-возврат.
 *
 * @remarks
 * Возврат денег - свой документ, как кредит-нота в Odoo: оплаченный счёт так и
 * остаётся оплаченным, и факт, что деньги приходили, не теряется. Оплаченный
 * возврат значит «деньги отправлены покупателю».
 */
export type InvoiceKind = 'invoice' | 'refund';
export type InvoiceStatus = 'draft' | 'issued' | 'reported' | 'paid' | 'voided';

/**
 * Зачем выставлен счёт на оплату: бронь (задаток) или оплата позиций.
 *
 * @remarks
 * Счёт на бронь доступа к видео не выдаёт: бронь закрепляет позицию, а не
 * продаёт её. Основной счёт после брони берёт за позицию цену минус бронь.
 */
export type InvoicePurpose = 'payment' | 'deposit';
export type InvoiceAction = 'issue' | 'report' | 'confirm' | 'reject' | 'void';

export interface Transition<S extends string> {
  readonly from: readonly S[];
  readonly to: S;
  readonly actors: readonly Actor[];
}

export const ORDER_TRANSITIONS: Readonly<Record<OrderAction, Transition<OrderStatus>>> = {
  accept: { from: ['new'], to: 'accepted', actors: ['manager'] },
  complete: { from: ['accepted'], to: 'done', actors: ['manager'] },
  cancel: { from: ['new', 'accepted'], to: 'cancelled', actors: ['manager', 'buyer', 'system'] },
};

/**
 * Кто отменяет только непринятый заказ.
 *
 * @remarks
 * Принятый заказ менеджер уже считает и везёт. Система отменяет новый заказ,
 * который не приняли за {@link STALE_ORDER_HOURS} часов: иначе оформленный
 * ради шутки заказ держит штучную позицию (щенка) вне витрины без срока.
 */
/**
 * Как позицию покупают: корзиной - остаток списывается при оформлении; заявкой -
 * при принятии заказа менеджером.
 *
 * @remarks
 * Заявка нужна там, где продавец сначала решает, кому продать: щенок, место на
 * курсе. Пока заявку не приняли, позиция остаётся на витрине для других, и
 * шуточный заказ не снимает её с продажи (#156).
 */
export type HowToBuy = 'cart' | 'request';
export const HOW_TO_BUY: readonly HowToBuy[] = ['cart', 'request'];

/** Держит ли строка заказа остаток позиции в этом состоянии заказа. */
export function holdsStock(mode: HowToBuy, status: OrderStatus): boolean {
  if (status === 'cancelled') return false;
  return mode === 'cart' || status !== 'new';
}

/**
 * Что сделать с остатком при переходе заказа: какие строки списать, какие вернуть.
 *
 * @remarks
 * Оформление - переход из «ничего не держит» (`null`) в «новый». Сценарии
 * берут списание и возврат только отсюда: правило, кто держит остаток, живёт
 * в одном месте - {@link holdsStock}.
 */
export function stockMoves<L extends { readonly mode: HowToBuy }>(
  lines: readonly L[],
  from: OrderStatus | null,
  to: OrderStatus,
): { readonly take: L[]; readonly giveBack: L[] } {
  const held = (l: L, s: OrderStatus | null) => s !== null && holdsStock(l.mode, s);
  return {
    take: lines.filter((l) => !held(l, from) && held(l, to)),
    giveBack: lines.filter((l) => held(l, from) && !held(l, to)),
  };
}

export const CANCEL_FROM_NEW_ONLY: readonly Actor[] = ['buyer', 'system'];
export const STALE_ORDER_HOURS = 72;

export const INVOICE_TRANSITIONS: Readonly<Record<InvoiceAction, Transition<InvoiceStatus>>> = {
  issue: { from: ['draft'], to: 'issued', actors: ['manager'] },
  report: { from: ['issued'], to: 'reported', actors: ['buyer'] },
  // Деньги нашёл менеджер в выписке или прислал платёжный сервис.
  confirm: { from: ['issued', 'reported'], to: 'paid', actors: ['manager', 'system'] },
  reject: { from: ['reported'], to: 'issued', actors: ['manager'] },
  void: { from: ['issued', 'reported'], to: 'voided', actors: ['manager'] },
};

/** «Я оплатил» бывает только у счёта на оплату: о возврате покупатель не заявляет. */
export const REPORT_KINDS: readonly InvoiceKind[] = ['invoice'];

export const ORDER_FINAL: readonly OrderStatus[] = ['done', 'cancelled'];
export const INVOICE_FINAL: readonly InvoiceStatus[] = ['paid', 'voided'];
/** Счета, которые отмена заказа аннулирует сама; черновики удаляются. */
export const INVOICE_OPEN: readonly InvoiceStatus[] = ['issued', 'reported'];

/** Можно ли участнику сделать действие с заказом в этом состоянии. */
export function canOrder(status: OrderStatus, action: OrderAction, actor: Actor): boolean {
  const t = ORDER_TRANSITIONS[action];
  if (!t.from.includes(status) || !t.actors.includes(actor)) return false;
  if (action === 'cancel' && CANCEL_FROM_NEW_ONLY.includes(actor)) return status === 'new';
  return true;
}

/** Можно ли участнику сделать действие со счётом этого вида в этом состоянии. */
export function canInvoice(
  status: InvoiceStatus,
  action: InvoiceAction,
  actor: Actor,
  kind: InvoiceKind = 'invoice',
): boolean {
  const t = INVOICE_TRANSITIONS[action];
  if (!t.from.includes(status) || !t.actors.includes(actor)) return false;
  if (action === 'report') return REPORT_KINDS.includes(kind);
  return true;
}

/**
 * Просрочен ли счёт.
 *
 * @remarks
 * Не состояние, а вычисление, как фильтр Overdue в Odoo и флаг у Shopify:
 * срок прошёл, а оплаты нет. Оплатить просроченный можно так же, как любой
 * выставленный, поэтому отдельное состояние и плановая задача ничего не дают.
 */
export function isOverdue(
  invoice: { status: InvoiceStatus; dueAt?: string | null | undefined },
  now: Date,
): boolean {
  if (invoice.status !== 'issued' || !invoice.dueAt) return false;
  return new Date(invoice.dueAt).getTime() < now.getTime();
}

/**
 * Деньги покупателя у продавца по заказу: оплаченные счета минус оплаченные возвраты.
 *
 * @remarks
 * Заказ отменяется только при нуле (И-6): полученное по заказу сначала
 * возвращается счётом-возвратом.
 */
export function heldAmount(
  invoices: readonly { kind: InvoiceKind; status: InvoiceStatus; total: Micros }[],
): Micros {
  return invoices.reduce(
    (sum, i) => (i.status === 'paid' ? sum + (i.kind === 'refund' ? -i.total : i.total) : sum),
    0,
  );
}

/**
 * Сколько ещё можно вернуть по счёту: сумма счёта минус живые возвраты к нему.
 *
 * @remarks
 * Возвратов может быть несколько - деньги возвращают частями. Аннулированный
 * возврат не считается: его не было.
 */
export function refundable(
  invoiceTotal: Micros,
  refunds: readonly { status: InvoiceStatus; total: Micros }[],
): Micros {
  return (
    invoiceTotal - refunds.filter((r) => r.status !== 'voided').reduce((t, r) => t + r.total, 0)
  );
}

/**
 * Возвращены ли деньги за счёт целиком (И-5).
 *
 * @remarks
 * Только полный возврат отзывает доступ к видео: вернули часть денег за курс -
 * курс остаётся у покупателя.
 */
export function fullyRefunded(
  invoiceTotal: Micros,
  refunds: readonly { status: InvoiceStatus; total: Micros }[],
): boolean {
  return (
    refunds.filter((r) => r.status === 'paid').reduce((t, r) => t + r.total, 0) >= invoiceTotal
  );
}

/* ───────────────────────── Корзина и сборка заказа ───────────────────────── */

export interface CartLine {
  readonly offer: number;
  readonly quantity: number;
}

/** Позиция глазами сборки заказа: только то, что из базы нужно для строки. */
export interface OfferSnapshot {
  readonly id: number;
  readonly title: string;
  /** Пусто - «цена по запросу», в заказ не идёт. */
  readonly price: Micros | null;
  /** Пусто - без ограничений. */
  readonly stock: number | null;
  /** Доступ к видео, который продаёт позиция. */
  readonly access: number | null;
  readonly howToBuy: HowToBuy;
  /** Бронь за единицу: часть цены, которую платят вперёд; пусто - без брони. */
  readonly deposit: Micros | null;
}

export interface OrderLine {
  readonly offer: number;
  readonly title: string;
  readonly quantity: number;
  readonly price: Micros;
  readonly sum: Micros;
  readonly access: number | null;
  readonly mode: HowToBuy;
  /** Бронь за единицу на момент заказа: меньше цены и больше нуля, иначе пусто. */
  readonly deposit: Micros | null;
}

export type BuildOrderResult =
  | { readonly ok: true; readonly lines: readonly OrderLine[]; readonly total: Micros }
  | {
      readonly ok: false;
      /** Нечего заказывать: корзина пуста или все позиции без цены и удалены. */
      readonly empty: boolean;
      /** Позиции, которых меньше, чем просят: остаток мог уйти, пока человек выбирал. */
      readonly shortage: readonly { offer: number; available: number }[];
      /** Сумма не помещается в точные целые: такой заказ не принимается. */
      readonly tooLarge?: boolean;
    };

export const MAX_QUANTITY = 1000;
export const MAX_CART_LINES = 100;

/** Склеивает повторы одной позиции и выбрасывает мусор из присланного браузером. */
export function cleanCart(
  lines: ReadonlyArray<Partial<Record<keyof CartLine, unknown>>>,
): CartLine[] {
  const byOffer = new Map<number, number>();
  for (const line of lines) {
    const offer = Number(line.offer);
    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isInteger(offer) || offer <= 0 || !Number.isFinite(quantity) || quantity < 1)
      continue;
    byOffer.set(offer, Math.min((byOffer.get(offer) ?? 0) + quantity, MAX_QUANTITY));
  }
  return [...byOffer].slice(0, MAX_CART_LINES).map(([offer, quantity]) => ({ offer, quantity }));
}

/**
 * Заказ из корзины и позиций из базы (И-1, И-2).
 *
 * @remarks
 * Цена берётся из позиции, а не из корзины: подменить её в запросе нельзя.
 * Удалённая позиция и позиция без цены молча выпадают - их и в корзине уже
 * нельзя было купить. Нехватка остатка отклоняет заказ целиком: урезанный
 * заказ покупатель не просил.
 */
export function buildOrder(
  cart: ReadonlyArray<CartLine>,
  offers: ReadonlyArray<OfferSnapshot>,
): BuildOrderResult {
  const byId = new Map(offers.map((o) => [o.id, o]));
  const lines: OrderLine[] = [];
  const shortage: { offer: number; available: number }[] = [];
  for (const { offer, quantity } of cleanCart(cart)) {
    const o = byId.get(offer);
    if (!o || o.price === null || o.price <= 0) continue;
    if (o.stock !== null && quantity > o.stock) {
      shortage.push({ offer, available: Math.max(o.stock, 0) });
      continue;
    }
    lines.push({
      offer,
      title: o.title,
      quantity,
      price: o.price,
      sum: o.price * quantity,
      access: o.access,
      mode: o.howToBuy,
      deposit: o.deposit !== null && o.deposit > 0 && o.deposit < o.price ? o.deposit : null,
    });
  }
  if (shortage.length > 0 || lines.length === 0) {
    return { ok: false, empty: lines.length === 0 && shortage.length === 0, shortage };
  }
  const total = lines.reduce((t, l) => t + l.sum, 0);
  // Сумма строки и итог - целые микроединицы; за пределом точных целых счёт врёт.
  if (!Number.isSafeInteger(total) || lines.some((l) => !Number.isSafeInteger(l.sum))) {
    return { ok: false, empty: false, shortage: [], tooLarge: true };
  }
  return { ok: true, lines, total };
}

/** Строки счёта на бронь: по строке на каждую позицию заказа с бронью. */
export function depositLines(
  lines: readonly OrderLine[],
): { offer: null; title: string; quantity: number; price: Micros }[] {
  return lines
    .filter((l) => l.deposit !== null)
    .map((l) => ({
      offer: null,
      title: `Бронь: ${l.title}`,
      quantity: l.quantity,
      price: l.deposit!,
    }));
}

/** Цена позиции в основном счёте: после взятой брони - цена минус бронь. */
export function paymentPrice(line: OrderLine, depositTaken: boolean): Micros {
  return depositTaken && line.deposit !== null ? line.price - line.deposit : line.price;
}

/* ───────────────────────── Настройки магазина ───────────────────────── */

/** Спрашивать ли поле анкеты: обязательно, по желанию или не спрашивать. */
export type AskField = 'required' | 'optional' | 'hidden';

export interface CheckoutRules {
  readonly phone: AskField;
  readonly email: AskField;
  readonly comment: boolean;
}

export const DEFAULT_CHECKOUT: CheckoutRules = {
  phone: 'optional',
  email: 'optional',
  comment: true,
};

export interface ShopSettings {
  readonly payee: {
    readonly name: string;
    readonly inn: string;
    readonly account: string;
    readonly bank: string;
    readonly bik: string;
    readonly corrAccount: string;
  };
  readonly sbp: { readonly phone: string; readonly bank: string };
  readonly card: string;
  /** Сколько часов непринятый заказ ждёт менеджера, потом отменяется. */
  readonly orderHoldHours: number;
  /** Срок оплаты нового счёта по умолчанию, в днях; 0 - без срока. */
  readonly invoiceDueDays: number;
  readonly checkout: CheckoutRules;
}

/** Настройки магазина как они лежат в CMS: любое поле может быть пустым. */
export type ShopSettingsInput = {
  readonly [K in keyof ShopSettings]?: unknown;
};

export const DEFAULT_INVOICE_DUE_DAYS = 3;

const text = (v: unknown, max = 200): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';
const whole = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fallback;
const ask = (v: unknown, fallback: AskField): AskField =>
  v === 'required' || v === 'optional' || v === 'hidden' ? v : fallback;

/**
 * Настройки магазина с умолчаниями: пустое и негодное поле - значение по умолчанию.
 *
 * @remarks
 * Одна точка разбора для сценариев и сайта: срок брони заказа, срок счёта и
 * анкета читаются одинаково везде. Спрятать оба способа связи нельзя -
 * менеджеру будет некуда позвонить, - тогда телефон спрашивается по желанию.
 */
export function shopSettings(raw: ShopSettingsInput | null | undefined): ShopSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  const payee = (r['payee'] ?? {}) as Record<string, unknown>;
  const sbp = (r['sbp'] ?? {}) as Record<string, unknown>;
  const co = (r['checkout'] ?? {}) as Record<string, unknown>;
  let phone = ask(co['phone'], DEFAULT_CHECKOUT.phone);
  const email = ask(co['email'], DEFAULT_CHECKOUT.email);
  if (phone === 'hidden' && email === 'hidden') phone = 'optional';
  return {
    payee: {
      name: text(payee['name']),
      inn: text(payee['inn'], 12),
      account: text(payee['account'], 20),
      bank: text(payee['bank']),
      bik: text(payee['bik'], 9),
      corrAccount: text(payee['corrAccount'], 20),
    },
    sbp: { phone: text(sbp['phone'], 32), bank: text(sbp['bank']) },
    card: text(r['card'], 32),
    orderHoldHours: whole(r['orderHoldHours'], 1, 720, STALE_ORDER_HOURS),
    invoiceDueDays: whole(r['invoiceDueDays'], 0, 90, DEFAULT_INVOICE_DUE_DAYS),
    checkout: { phone, email, comment: co['comment'] !== false },
  };
}

/* ───────────────────────── Анкета покупателя ───────────────────────── */

export interface BuyerInput {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly comment: string;
}

export const BUYER_LIMITS = { name: 100, phone: 32, email: 254, comment: 1000 } as const;

export type BuyerErrors = Partial<Record<keyof BuyerInput | 'contact' | 'consent', string>>;

/**
 * Проверка анкеты: одна для формы на сайте и для сервера.
 *
 * @remarks
 * Ошибки - по полям, чтобы форма показала их рядом с полем. Что спрашивать,
 * решает владелец (`CheckoutRules`): обязательное поле не пустое, скрытое не
 * принимается вовсе. Когда ни одно поле связи не обязательно, нужно хотя бы
 * одно из спрошенных. Согласие на обработку данных обязательно
 * (152-ФЗ). Текст обрезается по краям и больше никак не меняется: экранирует
 * его тот, кто выводит, а не тот, кто принимает.
 */
export function checkBuyer(
  raw: Record<string, unknown>,
  rules: CheckoutRules = DEFAULT_CHECKOUT,
): { ok: true; buyer: BuyerInput } | { ok: false; errors: BuyerErrors } {
  const read = (k: keyof BuyerInput): string =>
    typeof raw[k] === 'string' ? (raw[k] as string).trim() : '';
  const buyer: BuyerInput = {
    name: read('name'),
    phone: rules.phone === 'hidden' ? '' : read('phone'),
    email: rules.email === 'hidden' ? '' : read('email'),
    comment: rules.comment ? read('comment') : '',
  };
  const errors: BuyerErrors = {};
  if (!buyer.name) errors.name = 'Как к вам обращаться';
  for (const k of Object.keys(BUYER_LIMITS) as (keyof BuyerInput)[]) {
    if (buyer[k].length > BUYER_LIMITS[k]) errors[k] = `Не длиннее ${BUYER_LIMITS[k]} знаков`;
  }
  if (rules.phone === 'required' && !buyer.phone) errors.phone = 'Нужен телефон';
  if (rules.email === 'required' && !buyer.email) errors.email = 'Нужна почта';
  const anyRequired = rules.phone === 'required' || rules.email === 'required';
  if (!anyRequired && !buyer.phone && !buyer.email) {
    errors.contact =
      rules.phone === 'hidden'
        ? 'Почта - чтобы с вами связаться'
        : rules.email === 'hidden'
          ? 'Телефон - чтобы с вами связаться'
          : 'Телефон или почта - чтобы с вами связаться';
  }
  if (buyer.phone && !/^\+?[\d\s()-]{5,}$/.test(buyer.phone)) errors.phone = 'Телефон цифрами';
  if (buyer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email))
    errors.email = 'Почта в виде name@example.ru';
  if (raw['consent'] !== true) errors.consent = 'Нужно согласие на обработку данных';
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, buyer };
}

/* ───────────────────────── Что видит сайт ───────────────────────── */

/**
 * Позиция витрины глазами сайта (`/api/shop/offers`).
 *
 * @remarks
 * Цена - `Money` в валюте магазина; пусто - «цена по запросу», в корзину не
 * кладётся. Сырые микроединицы из базы наружу не выходят.
 */
export interface OfferView {
  readonly id: number;
  readonly title: string;
  readonly price: Money | null;
  readonly stock: number | null;
  readonly summary: string | null;
  readonly image: unknown;
  readonly howToBuy: HowToBuy;
  /** Бронь за единицу; пусто - позиция без брони. */
  readonly deposit: Money | null;
}

export interface BuyerLineView {
  readonly title: string;
  readonly quantity: number;
  readonly price: Money;
  readonly sum: Money;
}

export interface BuyerInvoiceView {
  readonly id: string;
  readonly kind: InvoiceKind;
  readonly purpose: InvoicePurpose;
  readonly status: InvoiceStatus;
  readonly overdue: boolean;
  readonly dueAt: string | null;
  readonly total: Money;
  readonly lines: readonly BuyerLineView[];
  readonly codes: readonly string[];
}

/** Заказ глазами покупателя (И-8): только эти поля, ничего служебного. */
export interface BuyerOrderView {
  readonly id: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
  readonly total: Money;
  readonly lines: readonly (BuyerLineView & {
    readonly offer: number;
    /** Заявка: позицию подтвердит менеджер, остаток за покупателем ещё не закреплён. */
    readonly mode: HowToBuy;
  })[];
  readonly buyer: BuyerInput;
  readonly invoices: readonly BuyerInvoiceView[];
  /** Почему заказ отменён - покупатель видит её по своей ссылке; у неотменённого null. */
  readonly cancelReason: string | null;
}

export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  new: 'Новый',
  accepted: 'Принят',
  done: 'Выполнен',
  cancelled: 'Отменён',
};

export const INVOICE_STATUS_LABELS: Readonly<Record<InvoiceStatus, string>> = {
  draft: 'Черновик',
  issued: 'Ждёт оплаты',
  reported: 'Оплата проверяется',
  paid: 'Оплачен',
  voided: 'Аннулирован',
};
