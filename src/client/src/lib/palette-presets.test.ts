import { describe, expect, it } from 'vitest';

import { PALETTE_PRESETS, findPreset } from './palette-presets';

/**
 * Палитру выбирает контент-менеджер, а не разработчик, поэтому нечитаемое
 * сочетание должно отсекаться здесь, а не обнаруживаться на живом сайте.
 */

/** Относительная яркость по WCAG 2.1. */
function luminance(hex: string): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const int = parseInt(hex.slice(1), 16);
  const r = channel((int >> 16) & 255);
  const g = channel((int >> 8) & 255);
  const b = channel(int & 255);
  return 0.2126 * r + 0.0722 * b + 0.7152 * g;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('палитры', () => {
  it('находятся по id, неизвестный id даёт null', () => {
    expect(findPreset('ink-gold')?.label).toBe('Ink & Gold (чёрно-золотая)');
    expect(findPreset('нет-такой')).toBeNull();
    expect(findPreset(null)).toBeNull();
  });

  it('у всех id уникальны', () => {
    const ids = PALETTE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PALETTE_PRESETS.map((p) => [p.id, p] as const))(
    '%s: основной текст читается на фоне в обеих темах',
    (_id, preset) => {
      expect(contrast(preset.light.foreground, preset.light.background)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(preset.dark.foreground, preset.dark.background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(PALETTE_PRESETS.map((p) => [p.id, p] as const))(
    '%s: приглушённый текст читается на фоне в обеих темах',
    (_id, preset) => {
      expect(
        contrast(preset.light.foregroundMuted, preset.light.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrast(preset.dark.foregroundMuted, preset.dark.background)).toBeGreaterThanOrEqual(
        4.5,
      );
    },
  );

  it.each(PALETTE_PRESETS.map((p) => [p.id, p] as const))(
    '%s: акцент читается на фоне в обеих темах',
    (_id, preset) => {
      expect(contrast(preset.light.primary, preset.light.background)).toBeGreaterThanOrEqual(3);
      expect(contrast(preset.dark.primary, preset.dark.background)).toBeGreaterThanOrEqual(3);
    },
  );
});
