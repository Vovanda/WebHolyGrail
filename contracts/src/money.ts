/**
 * Деньги: внутри - целые микроединицы, наружу - объект Money.
 *
 * @remarks
 * Внутри модуля (домен, база) сумма - одно целое, микроединицы ×10⁶: дробных
 * типов в денежной логике нет, сумма строк всегда равна итогу. На любой границе
 * (браузер ↔ сервер, сервис ↔ сервис, вебхуки, события) сумма ходит только
 * объектом `Money { units, micros, currency }`: целые единицы валюты отдельно от
 * дробной части, поэтому предел точности JavaScript (2⁵³) относится к единицам, а
 * не ко всей сумме, и человек читает сумму как есть.
 */

/** Сумма во внутренних единицах: микроединицы валюты, ×10⁶. */
export type Micros = number;

export const MICROS_PER_UNIT = 1_000_000;

/** Валюты, которые принимает API. Код ISO 4217. */
export const CURRENCIES = ['RUB', 'USD', 'EUR', 'KZT', 'BYN'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Сумма на границе: целые единицы, дробная часть в микроединицах, валюта. Не отрицательная. */
export interface Money {
  readonly units: number;
  /** Дробная часть, 0..999 999. */
  readonly micros: number;
  readonly currency: Currency;
}

/**
 * Предел целых единиц: `units × 10⁶ + micros` должно собираться в `Micros` без потерь.
 *
 * @remarks
 * В JavaScript целые точны до 2⁵³, поэтому предел - около 9 млрд единиц валюты на
 * одну сумму. Разобрать большее можно, собрать - уже с потерей точности.
 */
export const MAX_UNITS = Math.floor(
  (Number.MAX_SAFE_INTEGER - (MICROS_PER_UNIT - 1)) / MICROS_PER_UNIT,
);

/**
 * Микроединицы → Money.
 *
 * @remarks
 * В API сумма не бывает отрицательной: знак несёт вид документа (возврат, списание),
 * а не число.
 */
export function toMoney(amount: Micros, currency: Currency): Money {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new RangeError(`сумма вне Money: ${amount}`);
  const units = Math.floor(amount / MICROS_PER_UNIT);
  return { units, micros: amount - units * MICROS_PER_UNIT, currency };
}

export function fromMoney(money: Money): Micros {
  return money.units * MICROS_PER_UNIT + money.micros;
}

/** Из единиц валюты, которые ввёл человек (4500.5), - в микроединицы, с одним округлением. */
export function unitsToMicros(units: number): Micros {
  return Math.round(units * MICROS_PER_UNIT);
}

/** Для показа в поле ввода: 4500500000 → 4500.5. */
export function microsToUnits(amount: Micros): number {
  return amount / MICROS_PER_UNIT;
}

export type MoneyError = 'shape' | 'units' | 'micros' | 'currency';

/**
 * Проверка Money на входе ручки.
 *
 * @remarks
 * Сырое число не принимается: только объект нужной формы. Отказ называет, что не
 * так, - для ответа 400 с ошибкой по полю.
 */
export function parseMoney(
  raw: unknown,
): { ok: true; money: Money } | { ok: false; error: MoneyError } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'shape' };
  const { units, micros, currency } = raw as Record<string, unknown>;
  if (typeof units !== 'number' || !Number.isInteger(units) || units < 0 || units > MAX_UNITS) {
    return { ok: false, error: 'units' };
  }
  if (
    typeof micros !== 'number' ||
    !Number.isInteger(micros) ||
    micros < 0 ||
    micros >= MICROS_PER_UNIT
  ) {
    return { ok: false, error: 'micros' };
  }
  if (typeof currency !== 'string' || !(CURRENCIES as readonly string[]).includes(currency)) {
    return { ok: false, error: 'currency' };
  }
  return { ok: true, money: { units, micros, currency: currency as Currency } };
}

/** «4 500,50 ₽»: целые без дробной части, иначе два знака. Валюта - из суммы. */
export function formatMoney(money: Money, locale = 'ru-RU'): string {
  const value = microsToUnits(fromMoney(money));
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ───────────────────────── Курс и перевод валют ───────────────────────── */

/**
 * Курс валюты к базовой валюте учёта.
 *
 * @remarks
 * Целое: микроединицы базовой валюты за одну единицу `currency`. Действует в
 * полуинтервале `[from, to)`; `to` пусто - действует сейчас. Курсы не правятся, а
 * заводятся новыми записями: документ прошлой даты переводится по курсу своей даты.
 */
export interface ExchangeRate {
  readonly currency: Currency;
  readonly microsPerUnit: number;
  /** ISO-дата начала действия, включительно. */
  readonly from: string;
  /** ISO-дата конца действия, не включительно; пусто - действует. */
  readonly to?: string | null;
}

export type RateResult = { ok: true; rate: ExchangeRate } | { ok: false; error: 'rate_missing' };

/**
 * Курс валюты на дату.
 *
 * @remarks
 * Курс на дату - версия, действовавшая в эту дату, то есть последняя, вступившая в
 * силу не позже неё; версии стыкуются без дыр. Текущим курсом прошлое не переводится:
 * иначе вчерашний документ менялся бы при каждом обновлении курсов.
 *
 * `rate_missing` - только для даты раньше первой версии: тогда курс на эту дату
 * берётся из сервиса банка и заводится версией (docs/adr/003-currencies.md).
 */
export function rateAt(rates: readonly ExchangeRate[], currency: Currency, at: Date): RateResult {
  const t = at.getTime();
  const rate = rates.find(
    (r) =>
      r.currency === currency &&
      r.microsPerUnit > 0 &&
      new Date(r.from).getTime() <= t &&
      (!r.to || t < new Date(r.to).getTime()),
  );
  return rate ? { ok: true, rate } : { ok: false, error: 'rate_missing' };
}

/**
 * Сумма во внешней валюте (микроединицы) → базовая валюта.
 *
 * @remarks
 * Через частное и остаток: `q × rate + r × rate / 10⁶`. Наивное `amount × rate / 10⁶`
 * переполняет точные целые на суммах, которые в результате ещё помещаются.
 */
export function toBaseMicros(amount: Micros, rate: ExchangeRate): Micros {
  const q = Math.floor(amount / MICROS_PER_UNIT);
  const r = amount - q * MICROS_PER_UNIT;
  return q * rate.microsPerUnit + Math.floor((r * rate.microsPerUnit) / MICROS_PER_UNIT);
}

/**
 * Базовая валюта → внешняя (микроединицы).
 *
 * @remarks
 * Перевод всегда из суммы в базовой валюте, а не из уже переведённой: цепочка
 * переводов не копит округление. Через частное и остаток по курсу:
 * `q × 10⁶ + r × 10⁶ / rate`.
 */
export function fromBaseMicros(base: Micros, rate: ExchangeRate): Micros {
  const q = Math.floor(base / rate.microsPerUnit);
  const r = base - q * rate.microsPerUnit;
  return q * MICROS_PER_UNIT + Math.floor((r * MICROS_PER_UNIT) / rate.microsPerUnit);
}

/** Сумма в базовой валюте → Money во внешней на дату; дата раньше первой версии - `rate_missing`. */
export function convertAt(
  base: Micros,
  currency: Currency,
  rates: readonly ExchangeRate[],
  at: Date,
): { ok: true; money: Money } | { ok: false; error: 'rate_missing' } {
  const found = rateAt(rates, currency, at);
  if (!found.ok) return found;
  return { ok: true, money: toMoney(fromBaseMicros(base, found.rate), currency) };
}

/**
 * Курс валюты к учёту на дату - цепочкой через основную валюту (ADR-003).
 *
 * @remarks
 * Основная валюта (рубль) связана с учётом своим курсом `main`, который владелец
 * меняет вручную. Добавленная валюта знает только кросс-курс к основной из
 * сервиса банка (`cross`: микроединицы основной за единицу валюты). Её курс к
 * учёту - произведение двух курсов на ту же дату, поэтому смена курса основной
 * одной правкой пересчитывает все валюты. Нет любого из двух на дату -
 * `rate_missing`: подмены текущим курсом нет.
 */
export function chainedRateAt(
  cross: readonly ExchangeRate[],
  main: readonly ExchangeRate[],
  mainCurrency: Currency,
  currency: Currency,
  at: Date,
): RateResult {
  const toMain = rateAt(main, mainCurrency, at);
  if (currency === mainCurrency || !toMain.ok) return toMain;
  const toCross = rateAt(cross, currency, at);
  if (!toCross.ok) return toCross;
  const ends = [toCross.rate.to, toMain.rate.to].filter((d): d is string => Boolean(d));
  return {
    ok: true,
    rate: {
      currency,
      microsPerUnit: toBaseMicros(toCross.rate.microsPerUnit, toMain.rate),
      from: toCross.rate.from > toMain.rate.from ? toCross.rate.from : toMain.rate.from,
      to: ends.length > 0 ? ends.sort()[0]! : null,
    },
  };
}

/** Курс по умолчанию: рубль - 1:1 к базовой валюте учёта, действует всегда. */
export const DEFAULT_RATES: readonly ExchangeRate[] = [
  { currency: 'RUB', microsPerUnit: MICROS_PER_UNIT, from: '1970-01-01T00:00:00.000Z', to: null },
];

/**
 * Версия курса, как она лежит в журнале: без конца действия.
 *
 * @remarks
 * Запись журнала не правится. Конец действия выводится из начала следующей версии
 * той же валюты, поэтому новой версии не нужно закрывать прежнюю записью в неё.
 * Снятая плановая версия остаётся в журнале с отметкой и в расчёт не идёт.
 */
export interface RateVersion {
  readonly currency: Currency;
  readonly microsPerUnit: number;
  readonly from: string;
  readonly cancelledAt?: string | null;
}

/** Версии журнала → курсы с концом действия: снятые выпадают, конец - начало следующей. */
export function ratesFromVersions(versions: readonly RateVersion[]): ExchangeRate[] {
  const live = versions
    .filter((v) => !v.cancelledAt)
    .map((v) => ({ v, t: new Date(v.from).getTime() }))
    .sort((a, b) => a.t - b.t);
  return live.map(({ v }, i) => {
    const next = live.slice(i + 1).find((n) => n.v.currency === v.currency);
    return {
      currency: v.currency,
      microsPerUnit: v.microsPerUnit,
      from: new Date(v.from).toISOString(),
      to: next ? new Date(next.v.from).toISOString() : null,
    };
  });
}

/**
 * Все курсы сайта: основная валюта к учёту и добавленные к основной (ADR-003).
 *
 * @remarks
 * `main` - версии курса основной валюты к учёту, их меняет владелец. `cross` -
 * кросс-курсы добавленных валют к основной из сервиса банка; у сайта с одной
 * валютой их нет.
 */
export interface RateBook {
  readonly mainCurrency: Currency;
  readonly main: readonly ExchangeRate[];
  readonly cross: readonly ExchangeRate[];
}

/** Книга по умолчанию: основная валюта рубль 1:1 к учёту, добавленных валют нет. */
export const DEFAULT_BOOK: RateBook = { mainCurrency: 'RUB', main: DEFAULT_RATES, cross: [] };

/** Курс валюты к учёту на дату по книге - цепочкой через основную. */
export function bookRateAt(book: RateBook, currency: Currency, at: Date): RateResult {
  return chainedRateAt(book.cross, book.main, book.mainCurrency, currency, at);
}

export type ScheduleResult =
  | { ok: true; rates: ExchangeRate[] }
  | { ok: false; error: 'not_after_last' | 'bad_rate' | 'nothing_scheduled' };

const lastOf = (rates: readonly ExchangeRate[], currency: Currency): ExchangeRate | undefined =>
  rates
    .filter((r) => r.currency === currency)
    .reduce<
      ExchangeRate | undefined
    >((last, r) => (!last || new Date(r.from) > new Date(last.from) ? r : last), undefined);

/**
 * Новая версия курса с датой начала - сейчас или запланированная на будущее.
 *
 * @remarks
 * Курс не правится, а дополняется версией: последняя закрывается датой начала новой.
 * Дата обязана быть позже начала последней версии - прошлое не переписывается, и
 * документ прошлой даты остаётся переведён по своему курсу.
 */
export function scheduleRate(
  rates: readonly ExchangeRate[],
  currency: Currency,
  microsPerUnit: number,
  from: Date,
): ScheduleResult {
  if (!Number.isSafeInteger(microsPerUnit) || microsPerUnit <= 0)
    return { ok: false, error: 'bad_rate' };
  const last = lastOf(rates, currency);
  if (last && from.getTime() <= new Date(last.from).getTime())
    return { ok: false, error: 'not_after_last' };
  const start = from.toISOString();
  return {
    ok: true,
    rates: [
      ...rates.map((r) => (r === last ? { ...r, to: start } : r)),
      { currency, microsPerUnit, from: start, to: null },
    ],
  };
}

/** Снять запланированную версию, которая ещё не наступила; предыдущая снова открыта. */
export function cancelScheduled(
  rates: readonly ExchangeRate[],
  currency: Currency,
  now: Date,
): ScheduleResult {
  const last = lastOf(rates, currency);
  if (!last || new Date(last.from).getTime() <= now.getTime())
    return { ok: false, error: 'nothing_scheduled' };
  const rest = rates.filter((r) => r !== last);
  const prev = lastOf(rest, currency);
  return { ok: true, rates: rest.map((r) => (r === prev ? { ...r, to: null } : r)) };
}
