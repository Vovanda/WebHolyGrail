import { describe, expect, it } from 'vitest';

import {
  bookRateAt,
  cancelScheduled,
  chainedRateAt,
  convertAt,
  DEFAULT_BOOK,
  DEFAULT_RATES,
  type ExchangeRate,
  formatMoney,
  fromBaseMicros,
  fromMoney,
  MAX_UNITS,
  parseMoney,
  rateAt,
  ratesFromVersions,
  scheduleRate,
  toBaseMicros,
  toMoney,
  unitsToMicros,
} from './money';

describe('Money на границе', () => {
  it('микроединицы раскладываются на единицы и дробную часть и собираются обратно', () => {
    expect(toMoney(4_500_500_000, 'RUB')).toEqual({
      units: 4500,
      micros: 500_000,
      currency: 'RUB',
    });
    expect(fromMoney({ units: 4500, micros: 500_000, currency: 'RUB' })).toBe(4_500_500_000);
  });

  it('отрицательной суммы в Money нет: знак несёт вид документа', () => {
    expect(() => toMoney(-1, 'RUB')).toThrow(RangeError);
  });

  it('предел целых единиц - сборка в микроединицы без потерь', () => {
    const top = toMoney(MAX_UNITS * 1_000_000 + 999_999, 'RUB');
    expect(fromMoney(top)).toBe(MAX_UNITS * 1_000_000 + 999_999);
    expect(Number.isSafeInteger(fromMoney(top))).toBe(true);
    expect(parseMoney({ units: MAX_UNITS + 1, micros: 0, currency: 'RUB' })).toEqual({
      ok: false,
      error: 'units',
    });
  });

  it('ввод человека округляется один раз', () => {
    expect(unitsToMicros(4500.5)).toBe(4_500_500_000);
    expect(unitsToMicros(0.1 + 0.2)).toBe(300_000);
  });
});

describe('проверка Money на входе', () => {
  it('сырое число и чужая форма - отказ с причиной', () => {
    expect(parseMoney(4500.5)).toEqual({ ok: false, error: 'shape' });
    expect(parseMoney({ units: 1.5, micros: 0, currency: 'RUB' })).toEqual({
      ok: false,
      error: 'units',
    });
    expect(parseMoney({ units: 1, micros: 1_000_000, currency: 'RUB' })).toEqual({
      ok: false,
      error: 'micros',
    });
    expect(parseMoney({ units: -1, micros: 0, currency: 'RUB' })).toEqual({
      ok: false,
      error: 'units',
    });
    expect(parseMoney({ units: 1, micros: -5, currency: 'RUB' })).toEqual({
      ok: false,
      error: 'micros',
    });
    expect(parseMoney({ units: 1, micros: 0, currency: 'XXX' })).toEqual({
      ok: false,
      error: 'currency',
    });
  });
});

describe('показ', () => {
  it('целые без дробной части, дробные - два знака, валюта из суммы', () => {
    const norm = (s: string) => s.replace(/\s/g, ' ');
    expect(norm(formatMoney({ units: 12_550, micros: 0, currency: 'RUB' }))).toBe('12 550 ₽');
    expect(norm(formatMoney({ units: 12_550, micros: 500_000, currency: 'RUB' }))).toBe(
      '12 550,50 ₽',
    );
  });
});

describe('курс и перевод', () => {
  const usd = (microsPerUnit: number, from: string, to?: string): ExchangeRate => ({
    currency: 'USD',
    microsPerUnit,
    from,
    to: to ?? null,
  });
  const rates = [usd(90_000_000, '2026-10-01', '2026-10-15'), usd(95_000_000, '2026-10-15')];

  it('курс берётся на дату документа', () => {
    const at = (d: string) => {
      const r = rateAt(rates, 'USD', new Date(d));
      return r.ok ? r.rate.microsPerUnit : r.error;
    };
    expect(at('2026-10-10')).toBe(90_000_000);
    expect(at('2026-10-15')).toBe(95_000_000);
  });

  it('нет курса на дату - rate_missing, текущим не подменяется', () => {
    expect(rateAt(rates, 'USD', new Date('2026-09-01'))).toEqual({
      ok: false,
      error: 'rate_missing',
    });
    expect(convertAt(1_000_000, 'EUR', rates, new Date('2026-10-10'))).toEqual({
      ok: false,
      error: 'rate_missing',
    });
  });

  it('перевод туда и обратно сходится, сумма в долларах - из базы', () => {
    const r = usd(90_000_000, '2026-10-01');
    const dollars = 12_340_000; // 12,34 $
    const base = toBaseMicros(dollars, r);
    expect(base).toBe(1_110_600_000); // 1 110,60 в базовой
    expect(fromBaseMicros(base, r)).toBe(dollars);
    const money = convertAt(base, 'USD', [r], new Date('2026-10-02'));
    expect(money).toEqual({ ok: true, money: { units: 12, micros: 340_000, currency: 'USD' } });
  });

  it('частное и остаток не переполняют точные целые на большой сумме', () => {
    const r = usd(90_000_000, '2026-10-01');
    const big = 90_000_000_000_000; // 90 млн $ в микроединицах
    const base = toBaseMicros(big, r);
    expect(Number.isSafeInteger(base)).toBe(true);
    expect(base).toBe(8_100_000_000_000_000);
    expect(Number.isSafeInteger(big * r.microsPerUnit)).toBe(false); // наивная формула переполнила бы
  });
});

describe('версии курса и плановая смена', () => {
  it('по умолчанию рубль 1:1', () => {
    const r = convertAt(4_500_500_000, 'RUB', DEFAULT_RATES, new Date());
    expect(r).toEqual({ ok: true, money: { units: 4500, micros: 500_000, currency: 'RUB' } });
  });

  it('запланированная смена действует с даты, до неё - прежний курс', () => {
    const now = new Date('2026-10-23T00:00:00Z');
    const s = scheduleRate(DEFAULT_RATES, 'RUB', 1_100_000, new Date('2026-11-01T00:00:00Z'));
    if (!s.ok) throw new Error(s.error);
    const at = (d: string) => {
      const r = rateAt(s.rates, 'RUB', new Date(d));
      return r.ok ? r.rate.microsPerUnit : r.error;
    };
    expect(at(now.toISOString())).toBe(1_000_000);
    expect(at('2026-11-01T00:00:00Z')).toBe(1_100_000);
  });

  it('прошлое не переписывается: версия не раньше последней', () => {
    const s = scheduleRate(DEFAULT_RATES, 'RUB', 1_100_000, new Date('1960-01-01T00:00:00Z'));
    expect(s).toEqual({ ok: false, error: 'not_after_last' });
    expect(scheduleRate(DEFAULT_RATES, 'RUB', 0, new Date())).toEqual({
      ok: false,
      error: 'bad_rate',
    });
  });

  it('ненаступившую смену можно снять, наступившую - нет', () => {
    const now = new Date('2026-10-23T00:00:00Z');
    const s = scheduleRate(DEFAULT_RATES, 'RUB', 1_100_000, new Date('2026-11-01T00:00:00Z'));
    if (!s.ok) throw new Error(s.error);
    const c = cancelScheduled(s.rates, 'RUB', now);
    expect(c.ok && c.rates).toEqual(DEFAULT_RATES);
    expect(cancelScheduled(s.rates, 'RUB', new Date('2026-11-02T00:00:00Z'))).toEqual({
      ok: false,
      error: 'nothing_scheduled',
    });
  });
});

describe('курс цепочкой через основную валюту', () => {
  const v = (
    currency: 'RUB' | 'USD',
    rub: number,
    from: string,
    to: string | null = null,
  ): ExchangeRate => ({
    currency,
    microsPerUnit: rub * 1_000_000,
    from,
    to,
  });
  const cross = [
    v('USD', 90, '2026-01-01T00:00:00Z', '2026-06-01T00:00:00Z'),
    v('USD', 100, '2026-06-01T00:00:00Z'),
  ];

  it('курс валюты к учёту - кросс-курс × курс основной, на дату документа', () => {
    const main = [v('RUB', 1, '1970-01-01T00:00:00Z')];
    const march = chainedRateAt(cross, main, 'RUB', 'USD', new Date('2026-03-01T00:00:00Z'));
    const july = chainedRateAt(cross, main, 'RUB', 'USD', new Date('2026-07-01T00:00:00Z'));
    expect(march.ok && march.rate.microsPerUnit).toBe(90_000_000);
    expect(july.ok && july.rate.microsPerUnit).toBe(100_000_000);
  });

  it('смена курса основной одной правкой пересчитывает добавленные валюты', () => {
    const main = [
      v('RUB', 1, '1970-01-01T00:00:00Z', '2026-07-01T00:00:00Z'),
      {
        currency: 'RUB' as const,
        microsPerUnit: 2_000_000,
        from: '2026-07-01T00:00:00Z',
        to: null,
      },
    ];
    const r = chainedRateAt(cross, main, 'RUB', 'USD', new Date('2026-08-01T00:00:00Z'));
    expect(r.ok && r.rate.microsPerUnit).toBe(200_000_000);
    const before = chainedRateAt(cross, main, 'RUB', 'USD', new Date('2026-06-15T00:00:00Z'));
    expect(before.ok && before.rate.microsPerUnit).toBe(100_000_000);
  });

  it('нет кросс-курса на дату - rate_missing, без подмены; основная валюта - свой курс', () => {
    const main = [v('RUB', 1, '1970-01-01T00:00:00Z')];
    expect(chainedRateAt(cross, main, 'RUB', 'USD', new Date('2025-12-01T00:00:00Z'))).toEqual({
      ok: false,
      error: 'rate_missing',
    });
    const rub = chainedRateAt(cross, main, 'RUB', 'RUB', new Date('2026-03-01T00:00:00Z'));
    expect(rub.ok && rub.rate.microsPerUnit).toBe(1_000_000);
  });
});

describe('журнал версий курса', () => {
  it('конец действия - начало следующей версии той же валюты, порядок записи не важен', () => {
    const rates = ratesFromVersions([
      { currency: 'USD', microsPerUnit: 100_000_000, from: '2026-06-01T00:00:00Z' },
      { currency: 'RUB', microsPerUnit: 1_000_000, from: '1970-01-01T00:00:00Z' },
      { currency: 'USD', microsPerUnit: 90_000_000, from: '2026-01-01T00:00:00Z' },
    ]);
    expect(rates.filter((r) => r.currency === 'USD')).toEqual([
      {
        currency: 'USD',
        microsPerUnit: 90_000_000,
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-06-01T00:00:00.000Z',
      },
      { currency: 'USD', microsPerUnit: 100_000_000, from: '2026-06-01T00:00:00.000Z', to: null },
    ]);
    expect(rates.find((r) => r.currency === 'RUB')?.to).toBeNull();
  });

  it('снятая плановая версия в расчёт не идёт: прежняя снова действует', () => {
    const rates = ratesFromVersions([
      { currency: 'RUB', microsPerUnit: 1_000_000, from: '1970-01-01T00:00:00Z' },
      {
        currency: 'RUB',
        microsPerUnit: 2_000_000,
        from: '2026-12-01T00:00:00Z',
        cancelledAt: '2026-11-01T00:00:00Z',
      },
    ]);
    const r = rateAt(rates, 'RUB', new Date('2027-01-01T00:00:00Z'));
    expect(r.ok && r.rate.microsPerUnit).toBe(1_000_000);
  });

  it('книга по умолчанию: рубль 1:1, другой валюты нет - rate_missing', () => {
    const at = new Date('2026-10-23T00:00:00Z');
    const rub = bookRateAt(DEFAULT_BOOK, 'RUB', at);
    expect(rub.ok && rub.rate.microsPerUnit).toBe(1_000_000);
    expect(bookRateAt(DEFAULT_BOOK, 'USD', at)).toEqual({ ok: false, error: 'rate_missing' });
  });
});
