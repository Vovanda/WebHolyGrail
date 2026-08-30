import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { keyForPeriod, periodKey } from './crypto-period.js';

const secret = randomBytes(16);
const other = randomBytes(16);

describe('ключ криптопериода', () => {
  it('один и тот же у нарезки и у выдачи', () => {
    // Ради этого ключи и не хранятся: обе стороны приходят к одному значению.
    expect(periodKey(secret, 3)).toEqual(periodKey(secret, 3));
  });

  it('длиной с ключ AES-128', () => {
    expect(periodKey(secret, 0)).toHaveLength(16);
  });

  it('у соседних криптопериодов разный', () => {
    expect(periodKey(secret, 3)).not.toEqual(periodKey(secret, 4));
  });

  it('у разных записей разный при том же номере', () => {
    expect(periodKey(secret, 3)).not.toEqual(periodKey(other, 3));
  });

  it('не совпадает с секретом записи', () => {
    // Секрет не должен покидать сервер даже в виде ключа первой криптопериоды.
    expect(periodKey(secret, 0)).not.toEqual(secret);
  });

  it('отрицательный номер не принимается', () => {
    expect(() => periodKey(secret, -1)).toThrow();
  });
});

describe('выдача по номеру криптопериоды', () => {
  it('криптопериодовной записи отдаётся ключ запрошенной криптопериоды', () => {
    const picked = keyForPeriod(secret, 5, true);
    expect(picked).toEqual({ ok: true, key: periodKey(secret, 5) });
  });

  it('криптопериодовной записи без номера отказ, а не секрет', () => {
    // Иначе на такой запрос ушёл бы корень, из которого выводятся все ключи.
    expect(keyForPeriod(secret, null, true)).toEqual({ ok: false, reason: 'period-required' });
  });

  it('записи без криптопериодов отдаётся её единственный ключ', () => {
    // Нарезанное до появления криптопериодов играет как раньше и перезаливки не требует.
    expect(keyForPeriod(secret, null, false)).toEqual({ ok: true, key: secret });
  });

  it('записи без криптопериодов номер криптопериода не принимается', () => {
    expect(keyForPeriod(secret, 2, false)).toEqual({ ok: false, reason: 'period-unexpected' });
  });
});
