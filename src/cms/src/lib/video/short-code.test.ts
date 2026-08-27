import { describe, expect, it } from 'vitest';

import { generateShortCode, looksLikeShortCode } from './short-code.js';

describe('короткий код', () => {
  it('нужной длины и из своего алфавита', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(7);
    expect(looksLikeShortCode(code)).toBe(true);
  });

  it('не содержит символов, которые путаются при чтении', () => {
    // Ноль и O, единица и l — ссылку часто диктуют по телефону.
    const codes = Array.from({ length: 200 }, () => generateShortCode()).join('');
    expect(codes).not.toMatch(/[0O1lI]/);
  });

  it('не повторяется на большом плейлисте', () => {
    const codes = new Set(Array.from({ length: 5000 }, () => generateShortCode()));
    expect(codes.size).toBe(5000);
  });

  it('чужие адреса отсеиваются без похода в базу', () => {
    expect(looksLikeShortCode('короткий')).toBe(false);
    expect(looksLikeShortCode('abc')).toBe(false);
    expect(looksLikeShortCode('0000000')).toBe(false);
    expect(looksLikeShortCode('../../etc')).toBe(false);
  });
});
