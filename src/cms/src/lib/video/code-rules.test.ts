import { describe, expect, it } from 'vitest';

import { codeExpiry, codeRules } from './code-rules';

describe('codeRules', () => {
  it('берёт значения из настроек', () => {
    expect(codeRules({ codeLength: '8', codeTtlMinutes: 120, accessDays: 7 })).toEqual({
      length: 8,
      ttlMinutes: 120,
      grantDays: 7,
    });
  });

  it('подставляет умолчания вместо незаполненного', () => {
    expect(codeRules({})).toEqual({ length: 6, ttlMinutes: 5, grantDays: 30 });
    expect(codeRules(null)).toEqual({ length: 6, ttlMinutes: 5, grantDays: 30 });
  });

  it('не пускает в срок то, что сроком быть не может', () => {
    // Ноль и минус выдали бы код, просроченный в момент выдачи.
    const rules = codeRules({ codeLength: '', codeTtlMinutes: 0, accessDays: -3 });
    expect(rules).toEqual({ length: 6, ttlMinutes: 5, grantDays: 30 });
  });
});

describe('codeExpiry', () => {
  it('отсчитывает срок от момента выдачи', () => {
    const now = new Date('2026-08-30T12:00:00.000Z');
    const rules = codeRules({ codeTtlMinutes: 15 });
    expect(codeExpiry(rules, now)).toBe('2026-08-30T12:15:00.000Z');
  });
});
