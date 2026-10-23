import { describe, expect, it } from 'vitest';

import { checkPhone } from './phone';

describe('формат телефона', () => {
  it('международный: номер любой страны, обрывок и буквы - нет', () => {
    expect(checkPhone('+44 20 7946 0958', 'intl')).toBe(true);
    expect(checkPhone('+1 (212) 555-0123', 'intl')).toBe(true);
    expect(checkPhone('+7 900 123-45-67', 'intl')).toBe(true);
    expect(checkPhone('11111', 'intl')).toBe(false);
    expect(checkPhone('8 900 abc', 'intl')).toBe(false);
  });

  it('Россия: 10 цифр или 11 с кодом 7 и 8', () => {
    expect(checkPhone('+7 (900) 123-45-67', 'ru')).toBe(true);
    expect(checkPhone('89001234567', 'ru')).toBe(true);
    expect(checkPhone('9001234567', 'ru')).toBe(true);
    expect(checkPhone('+44 20 7946 0958', 'ru')).toBe(false);
    expect(checkPhone('+7 900', 'ru')).toBe(false);
  });
});
