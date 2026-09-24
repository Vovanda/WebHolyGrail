import { describe, expect, it } from 'vitest';

import { otherAlign, readAlign, sheetSize } from './sheet-layout';

describe('лист редактора', () => {
  it('ширина листа - колонка блога, строка текста 880', () => {
    expect(sheetSize('page')).toEqual({ sheet: 1300, text: 880 });
    expect(sheetSize('medium')).toEqual({ sheet: 1080, text: 880 });
    expect(sheetSize('reading')).toEqual({ sheet: 880, text: 880 });
  });

  it('без настройки лист шириной страницы', () => {
    expect(sheetSize(undefined)).toEqual(sheetSize('page'));
    expect(sheetSize('huge')).toEqual(sheetSize('page'));
    expect(sheetSize('toString')).toEqual(sheetSize('page'));
  });

  it('выбор положения читается с запасом на мусор', () => {
    expect(readAlign('left')).toBe('left');
    expect(readAlign(null)).toBe('center');
    expect(readAlign('right')).toBe('center');
  });

  it('кнопка переключает положение туда и обратно', () => {
    expect(otherAlign('center')).toBe('left');
    expect(otherAlign(otherAlign('center'))).toBe('center');
  });
});
