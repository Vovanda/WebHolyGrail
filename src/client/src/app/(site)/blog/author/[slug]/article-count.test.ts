import { describe, expect, it } from 'vitest';

import { articleCount } from './page';

describe('articleCount', () => {
  it('склоняет по числу', () => {
    expect(articleCount(1)).toBe('1 запись');
    expect(articleCount(2)).toBe('2 записи');
    expect(articleCount(4)).toBe('4 записи');
    expect(articleCount(5)).toBe('5 записей');
    expect(articleCount(21)).toBe('21 запись');
    expect(articleCount(22)).toBe('22 записи');
  });

  it('одиннадцать-четырнадцать — исключение', () => {
    expect(articleCount(11)).toBe('11 записей');
    expect(articleCount(12)).toBe('12 записей');
    expect(articleCount(14)).toBe('14 записей');
  });

  it('на нуле ничего не показывает', () => {
    expect(articleCount(0)).toBeNull();
  });
});
