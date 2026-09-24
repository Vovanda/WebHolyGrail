import { describe, expect, it } from 'vitest';

import {
  ROW_CAPACITY,
  ROW_MIN_FRAMES,
  balancedRowLengths,
  rowBreaks,
  stretchAll,
  stretchOf,
  visibleSum,
} from './aspect-rows';

describe('раскладка рядами одной высоты', () => {
  it('широкий кадр растёт сильнее узкого', () => {
    const wide = stretchOf({ width: 1920, height: 1080 });
    const tall = stretchOf({ width: 1080, height: 1920 });
    expect(wide.aspect).toBeGreaterThan(tall.aspect);
    expect(wide.basis).toBeGreaterThan(tall.basis);
  });

  it('панорама не занимает ряд целиком - пропорция упирается в предел', () => {
    const panorama = stretchOf({ width: 4000, height: 800 });
    expect(panorama.aspect).toBe(2);
  });

  it('узкая вертикаль не сжимается в полоску - предел девять к шестнадцати', () => {
    const narrow = stretchOf({ width: 400, height: 1600 });
    expect(narrow.aspect).toBeCloseTo(9 / 16, 5);
  });

  it('кадр с телефона 874 на 1920 упирается в тот же предел', () => {
    expect(stretchOf({ width: 874, height: 1920 }).aspect).toBeCloseTo(9 / 16, 5);
  });

  it('кадр без размеров считается квадратным - раскладка не падает', () => {
    expect(stretchOf({})).toMatchObject({ aspect: 1 });
    expect(stretchOf({ width: 0, height: 0 })).toMatchObject({ aspect: 1 });
  });

  it('набор обрабатывается целиком, порядок сохраняется', () => {
    const got = stretchAll([
      { width: 1600, height: 900 },
      { width: 900, height: 1600 },
    ]);
    expect(got).toHaveLength(2);
    expect(got[0]!.aspect).toBeGreaterThan(got[1]!.aspect);
  });
});

describe('ровные ряды', () => {
  // Галерея из смоука 24.09: стоячий, панорама, 3:4, 4:3, стоячий.
  const owners = [0.5625, 1.78, 0.75, 1.33, 0.5625];
  const sums = (aspects: number[], lengths: number[]) => {
    let at = 0;
    return lengths.map((length) => {
      const sum = aspects.slice(at, at + length).reduce((a, b) => a + b, 0);
      at += length;
      return sum;
    });
  };

  it('пять кадров на широком экране - два и три, без одинокого хвоста', () => {
    expect(balancedRowLengths(owners, ROW_CAPACITY.lg)).toEqual([2, 3]);
  });

  it('один и два кадра - одним рядом', () => {
    expect(balancedRowLengths([1.33], ROW_CAPACITY.lg)).toEqual([1]);
    expect(balancedRowLengths([1.33, 0.75], ROW_CAPACITY.lg)).toEqual([2]);
  });

  it('семь и двенадцать кадров - ряды близкой высоты', () => {
    for (const count of [7, 12]) {
      const aspects = Array.from(
        { length: count },
        (_, i) => [1.33, 0.75, 1.78, 0.5625][i % 4] as number,
      );
      const lengths = balancedRowLengths(aspects, ROW_CAPACITY.lg);
      expect(lengths.reduce((a, b) => a + b, 0)).toBe(count);
      const rowSums = sums(aspects, lengths);
      // Высота ряда обратна сумме пропорций: самый высокий не выше самого низкого в полтора раза.
      expect(Math.max(...rowSums) / Math.min(...rowSums)).toBeLessThanOrEqual(1.5);
    }
  });

  it('восемь кадров - поровну, без низкого последнего ряда', () => {
    const aspects = [0.5625, 2, 0.75, 1.33, 0.5625, 2, 1.33, 0.5625];
    const rowSums = sums(aspects, balancedRowLengths(aspects, ROW_CAPACITY.lg));
    expect(Math.max(...rowSums) / Math.min(...rowSums)).toBeLessThanOrEqual(1.2);
  });

  it('ряд с суммой меньше единицы высотой в ширину колонки', () => {
    // Строка с суммой flex-grow меньше 1 не дотягивается до краёв.
    expect(visibleSum(0.5625)).toBe(1);
    expect(visibleSum(1.9)).toBe(1.9);
  });

  it('три панорамы на широком экране - одним рядом, а не стопкой', () => {
    const wide = [2, 2, 2];
    expect(balancedRowLengths(wide, ROW_CAPACITY.lg, ROW_MIN_FRAMES.lg)).toEqual([3]);
    expect(balancedRowLengths(wide, ROW_CAPACITY.sm, ROW_MIN_FRAMES.sm).length).toBeGreaterThan(1);
  });

  it('с минимумом два кадра в ряду одиночных рядов нет', () => {
    for (const count of [4, 5, 6, 7, 8, 9]) {
      const aspects = Array.from(
        { length: count },
        (_, i) => [2, 0.5625, 1.33, 0.75][i % 4] as number,
      );
      const lengths = balancedRowLengths(aspects, ROW_CAPACITY.lg, 2);
      expect(Math.min(...lengths)).toBeGreaterThanOrEqual(2);
      expect(lengths.reduce((a, b) => a + b, 0)).toBe(count);
    }
  });

  it('пустой набор - без рядов', () => {
    expect(balancedRowLengths([], ROW_CAPACITY.lg)).toEqual([]);
  });

  it('переносы на каждой ширине стоят после концов рядов', () => {
    const shapes = owners.map((a) => ({ width: Math.round(a * 1000), height: 1000 }));
    expect(rowBreaks(shapes).lg).toEqual([1]);
    expect(rowBreaks(shapes).sm.length).toBeGreaterThan(rowBreaks(shapes).lg.length);
  });
});
