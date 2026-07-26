import { describe, expect, it } from 'vitest';

import { contrastRatio, DARK_FG, LIGHT_FG, readableTextOn } from './contrast';
import { PALETTE_PRESETS } from './palette-presets';

describe('contrastRatio', () => {
  it('чёрный на белом — максимум 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('одинаковые цвета — 1', () => {
    expect(contrastRatio('#2563eb', '#2563eb')).toBeCloseTo(1, 5);
  });
});

describe('readableTextOn', () => {
  it('на золотом акценте выбирает тёмный текст', () => {
    expect(readableTextOn('#ffcb19')).toBe(DARK_FG);
  });

  it('на синем акценте выбирает светлый текст', () => {
    expect(readableTextOn('#2563eb')).toBe(LIGHT_FG);
  });

  it('невалидный hex не роняет — отдаёт светлый текст', () => {
    expect(readableTextOn('rgb(255,0,0)')).toBe(LIGHT_FG);
  });
});

describe('текст на акцентной кнопке читается во всех пресетах', () => {
  it.each(PALETTE_PRESETS.map((p) => [p.id, p] as const))('%s', (_id, preset) => {
    for (const scheme of [preset.light, preset.dark]) {
      expect(contrastRatio(scheme.primary, readableTextOn(scheme.primary))).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });
});
