import { describe, expect, it } from 'vitest';

import { generateAccessCode, normalizeAccessCode } from './short-code.js';

describe('код доступа', () => {
  it('шесть символов по умолчанию', () => {
    expect(generateAccessCode()).toHaveLength(6);
  });

  it('длина настраивается', () => {
    expect(generateAccessCode(8)).toHaveLength(8);
  });

  it('только заглавные и цифры, без похожих символов', () => {
    // Код диктуют по телефону: ноль с буквой O и единица с I путаются.
    const codes = Array.from({ length: 300 }, () => generateAccessCode()).join('');
    expect(codes).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/);
  });

  it('не повторяется на большом наборе', () => {
    const codes = new Set(Array.from({ length: 3000 }, () => generateAccessCode(8)));
    expect(codes.size).toBe(3000);
  });

  it('строчные приводятся к виду выдачи', () => {
    expect(normalizeAccessCode('  k7m4x9 ')).toBe('K7M4X9');
  });

  it('привычные опечатки исправляются, а не отвергаются', () => {
    // Человек написал букву O вместо нуля и I вместо единицы — тот же код.
    expect(normalizeAccessCode('OBC1DE')).toBe('0BC1DE');
    expect(normalizeAccessCode('0BCIDE')).toBe('0BC1DE');
    expect(normalizeAccessCode('0BCLDE')).toBe('0BC1DE');
  });

  it('исправленный код остаётся в алфавите выдачи', () => {
    // Иначе выданный код с «L» после исправления не совпал бы сам с собой.
    expect(normalizeAccessCode(generateAccessCode(8))).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/);
  });

  it('лишние символы отбрасываются', () => {
    expect(normalizeAccessCode('K7-M4 X9')).toBe('K7M4X9');
  });
});
