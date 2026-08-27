import { describe, expect, it } from 'vitest';

import { parseTimecode } from './useVideoTimecode';

/**
 * Таймкод приходит от людей: из адресной строки, из пересланной ссылки, иногда
 * набранный руками. Разбор обязан принимать оба привычных вида и молча
 * пропускать мусор.
 */

describe('parseTimecode', () => {
  it('понимает секунды числом', () => {
    expect(parseTimecode('200')).toBe(200);
    expect(parseTimecode('0')).toBe(0);
  });

  it('понимает часы, минуты и секунды', () => {
    expect(parseTimecode('3m20s')).toBe(200);
    expect(parseTimecode('1h')).toBe(3600);
    expect(parseTimecode('1h2m3s')).toBe(3723);
    expect(parseTimecode('45s')).toBe(45);
  });

  it('регистр не важен: ссылки пересылают как придётся', () => {
    expect(parseTimecode('1H2M3S')).toBe(3723);
  });

  it('дробные секунды округляет вниз', () => {
    expect(parseTimecode('12.7')).toBe(12);
  });

  it('мусор и пустое значение не считает таймкодом', () => {
    expect(parseTimecode(null)).toBeNull();
    expect(parseTimecode('')).toBeNull();
    expect(parseTimecode('abc')).toBeNull();
    expect(parseTimecode('-30')).toBeNull();
    expect(parseTimecode('m')).toBeNull();
  });
});
