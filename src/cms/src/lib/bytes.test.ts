import { describe, expect, it } from 'vitest';

import { formatBytes } from './bytes';

describe('вес файла словами', () => {
  it('меньше килобайта - в байтах', () => {
    expect(formatBytes(640)).toBe('640 Б');
  });

  it('до десяти единиц - с десятой', () => {
    expect(formatBytes(8.4 * 1024)).toBe('8.4 КБ');
  });

  it('от десяти - целым', () => {
    expect(formatBytes(120.4 * 1024 * 1024)).toBe('120 МБ');
  });

  it('гигабайты не переходят в следующую единицу', () => {
    expect(formatBytes(3 * 1024 ** 4)).toBe('3072 ГБ');
  });
});
