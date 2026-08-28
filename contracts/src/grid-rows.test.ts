import { describe, expect, it } from 'vitest';

import { balancedRows, splitIntoRows } from './grid-rows';

/**
 * Требование владельца к раскладке: фигура читается одинаково сверху вниз,
 * а когда симметрий несколько - длинные ряды снаружи.
 */
describe('balancedRows', () => {
  it('при трёх колонках раскладывает симметрично', () => {
    expect(balancedRows(1, 3)).toEqual([1]);
    expect(balancedRows(2, 3)).toEqual([2]);
    expect(balancedRows(3, 3)).toEqual([3]);
    expect(balancedRows(4, 3)).toEqual([2, 2]);
    expect(balancedRows(6, 3)).toEqual([3, 3]);
    expect(balancedRows(7, 3)).toEqual([2, 3, 2]);
    expect(balancedRows(8, 3)).toEqual([3, 2, 3]);
    expect(balancedRows(9, 3)).toEqual([3, 3, 3]);
    expect(balancedRows(13, 3)).toEqual([3, 2, 3, 2, 3]);
  });

  it('из нескольких симметрий берёт ту, где длинные ряды по краям', () => {
    // десять при трёх в ряду: 2 3 3 2 тоже палиндром, но края держат ширину
    expect(balancedRows(10, 3)).toEqual([3, 2, 2, 3]);
    expect(balancedRows(14, 4)).toEqual([4, 3, 3, 4]);
  });

  it('где симметрии не существует, длинный ряд идёт первым', () => {
    // пять в два ряда: палиндрома из пяти не выходит никак
    expect(balancedRows(5, 3)).toEqual([3, 2]);
    expect(balancedRows(7, 4)).toEqual([4, 3]);
  });

  it('девять карточек при четырёх колонках не оставляют сироту', () => {
    // ловилось на живом сайте: выходило четыре, четыре и одна
    expect(balancedRows(9, 4)).toEqual([3, 3, 3]);
    expect(balancedRows(5, 4)).toEqual([3, 2]);
    expect(balancedRows(10, 4)).toEqual([3, 4, 3]);
  });

  it('одинокий ряд появляется только там, где иначе нельзя', () => {
    // две колонки на три карточки: раскладки без ряда из одной не существует
    expect(balancedRows(3, 2)).toEqual([2, 1]);
    // а вот при трёх и больше колонках такого не выходит нигде до двадцати
    for (let n = 2; n <= 20; n++) {
      for (const max of [3, 4, 5]) {
        const rows = balancedRows(n, max);
        if (rows.length > 1) expect(Math.min(...rows)).toBeGreaterThan(1);
      }
    }
  });

  it('ряды длиннее предела колонок не бывают, и карточки не теряются', () => {
    for (let n = 1; n <= 30; n++) {
      for (const max of [2, 3, 4, 5]) {
        const rows = balancedRows(n, max);
        expect(Math.max(...rows)).toBeLessThanOrEqual(max);
        expect(rows.reduce((sum, r) => sum + r, 0)).toBe(n);
      }
    }
  });

  it('пустой список рядов не даёт', () => {
    expect(balancedRows(0, 3)).toEqual([]);
  });
});

describe('splitIntoRows', () => {
  it('раскладывает сами карточки в том же порядке', () => {
    expect(splitIntoRows(['а', 'б', 'в', 'г'], 3)).toEqual([
      ['а', 'б'],
      ['в', 'г'],
    ]);
    expect(splitIntoRows([1, 2, 3, 4, 5, 6, 7, 8], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
      [6, 7, 8],
    ]);
  });
});
