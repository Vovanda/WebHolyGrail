import {
  convertAt,
  type Currency,
  DEFAULT_RATES,
  type ExchangeRate,
  fromMoney,
  rateAt,
  toBaseMicros,
} from 'contracts';

import type { MoneyPort } from './ports';

/**
 * Деньги магазина наружу: учёт → `Money` в валюте магазина.
 *
 * @remarks
 * Перевод идёт по курсу на дату документа, а не по текущему: заказ прошлого
 * месяца показывает те же суммы, что и в день оформления. Пока сервиса курсов
 * нет, у магазина рубль 1:1 к учёту; курсы версиями подставит модуль курсов,
 * не трогая сценарии (docs/adr/003-currencies.md).
 *
 * Курса на дату нет - исключение, а не подмена текущим курсом: сумма в чужом
 * курсе хуже отказа показать заказ.
 */
export function moneyPort(
  currency: Currency = 'RUB',
  rates: readonly ExchangeRate[] = DEFAULT_RATES,
): MoneyPort {
  return {
    at: (amount, date) => {
      const result = convertAt(amount, currency, rates, date);
      if (!result.ok) throw new Error(`rate_missing: ${currency} на ${date.toISOString()}`);
      return result.money;
    },
    back: (money, date) => {
      if (money.currency !== currency) return null;
      const found = rateAt(rates, currency, date);
      if (!found.ok) throw new Error(`rate_missing: ${currency} на ${date.toISOString()}`);
      return toBaseMicros(fromMoney(money), found.rate);
    },
  };
}
