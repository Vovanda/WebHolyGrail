import { describe, expect, it } from 'vitest';

import { areasWidth, layout, layouts, parseAreas, placeAll } from './grid-areas';

/**
 * Спецификация нотации: каждый случай здесь - правило, а не пример.
 *
 * Порядок разделов повторяет docs/ux/primitives/tiles-notation.md. Правило
 * меняется - сперва правится документ и этот набор, потом разбор.
 */

const names = (raw: string) => parseAreas(raw)?.map((area) => area.name) ?? null;
const at = (raw: string, name: string) => parseAreas(raw)?.find((area) => area.name === name);

describe('ячейки и ряды', () => {
  it('пробел разделяет ячейки, двоеточие - ряды', () => {
    expect(names('a b : c d')).toEqual(['a', 'b', 'c', 'd']);
    expect(at('a b : c d', 'c')).toMatchObject({ row: 2, column: 1 });
  });

  it('лишние пробелы ничего не значат', () => {
    expect(names('  a   b :c d  ')).toEqual(names('a b : c d'));
  });

  it('слитная запись читается по знакам', () => {
    expect(names('ab : cd')).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('имя и порядок карточек', () => {
  it('порядок имён по алфавиту и есть порядок карточек', () => {
    expect(parseAreas('b a')?.map((area) => area.index)).toEqual([0, 1]);
    expect(at('b a', 'a')).toMatchObject({ index: 0, column: 2 });
    expect(at('b a', 'b')).toMatchObject({ index: 1, column: 1 });
  });

  it('имя выбирают любое, важно только его место среди других', () => {
    expect(parseAreas('x y z')?.map((area) => area.index)).toEqual([0, 1, 2]);
  });
});

describe('размер', () => {
  it('имя в соседних ячейках занимает две колонки', () => {
    expect(at('a a b', 'a')).toMatchObject({ width: 2, height: 1 });
  });

  it('имя в двух рядах занимает два ряда', () => {
    expect(at('a b : a c', 'a')).toMatchObject({ width: 1, height: 2 });
  });

  it('повтор числом - то же, что имя подряд', () => {
    expect(parseAreas('3a b')).toEqual(parseAreas('a a a b'));
  });

  it('область должна быть цельным прямоугольником', () => {
    expect(parseAreas('a b : b a')).toBeNull();
    expect(parseAreas('a a : b c : a b')).toBeNull();
  });
});

describe('пустота', () => {
  it('точка занимает место', () => {
    expect(at('. a', 'a')).toMatchObject({ column: 2 });
  });

  it('точки подряд считаются каждая за своё', () => {
    expect(areasWidth('.... a')).toBe(5);
  });

  it('ряд без ячеек схлопывается', () => {
    expect(parseAreas('a b : : c d')).toEqual(parseAreas('a b : c d'));
  });

  it('ряд из одних точек ширину сетки не задаёт', () => {
    expect(areasWidth('a b : . . . . .')).toBe(2);
  });

  it('ряд с именем задаёт ширину целиком, вместе с точками', () => {
    expect(areasWidth('. a . .')).toBe(4);
  });

  it('пусто и мусор дают пусто', () => {
    expect(parseAreas('')).toBeNull();
    expect(parseAreas(null)).toBeNull();
    expect(parseAreas('. .')).toBeNull();
  });
});

describe('выключенная карточка', () => {
  it('места не занимает', () => {
    expect(names('a -b c')).toEqual(['a', 'c']);
    expect(at('a -b c', 'c')).toMatchObject({ column: 2 });
  });

  it('ряд, где всё выключено, схлопывается', () => {
    expect(parseAreas('a b : -c -d')).toEqual(parseAreas('a b'));
  });

  it('до достройки не допускается: выключенная не возвращается хвостом', () => {
    const placed = placeAll('a b -c', 3, 3);
    expect(placed?.areas.map((area) => area.index)).toEqual([0, 1]);
  });

  it('повтор у выключенной не принимается', () => {
    expect(parseAreas('a -3b')).toBeNull();
  });
});

describe('запись не принимается', () => {
  it('посторонний знак', () => {
    expect(parseAreas('a b!')).toBeNull();
    expect(parseAreas('a #')).toBeNull();
  });

  it('число без имени', () => {
    expect(parseAreas('3 a')).toBeNull();
    expect(parseAreas('a 3')).toBeNull();
  });
});

describe('чего в записи нет - досчитывается', () => {
  it('заданное остаётся, остальное встаёт ниже', () => {
    const placed = placeAll('a b c e : a b d d', 9, 3);
    expect(placed?.areas.filter((area) => area.row <= 2).length).toBe(5);
    // четыре оставшихся легли под заданным, рядами по два
    expect(placed?.rows.slice(2)).toEqual([2, 2]);
  });

  it('досчитанным имя не даётся, только номер', () => {
    const placed = placeAll('a b', 5, 3);
    const extra = placed?.areas.filter((area) => area.name === '') ?? [];
    expect(extra.map((area) => area.index)).toEqual([2, 3, 4]);
  });

  it('без записи вся фигура считается сама', () => {
    const placed = placeAll('', 8, 3);
    expect(placed?.rows).toEqual([3, 2, 3]);
  });

  it('алфавит на достройку не влияет: тысяча карточек раскладывается', () => {
    const placed = placeAll('', 1000, 4);
    expect(placed?.areas.length).toBe(1000);
    expect(placed?.rows.reduce((sum, row) => sum + row, 0)).toBe(1000);
  });
});

describe('доли и центровка', () => {
  it('короткий ряд встаёт по центру', () => {
    const grid = layout('', 8, 3);
    expect(grid?.columns).toBe(6);
    expect(grid?.cells.find((cell) => cell.index === 3)).toMatchObject({ column: 2, row: 2 });
  });

  it('ряд с высокой плиткой не сдвигается', () => {
    const grid = layout('b c d e : f a a g : h a a', 8, 4);
    const a = grid?.cells.find((cell) => cell.name === 'a');
    const h = grid?.cells.find((cell) => cell.name === 'h');
    expect((h?.column ?? 0) + (h?.width ?? 0)).toBeLessThanOrEqual(a?.column ?? 0);
  });
});

describe('три ширины', () => {
  it('каждая считается своей вместимостью', () => {
    const grid = layouts({ lg: '', md: '', sm: '' }, 6, 3);
    expect(grid.lg?.columns).toBe(6);
    expect(grid.md?.columns).toBe(4);
    expect(grid.sm?.columns).toBe(2);
  });

  it('незаполненная не наследует фигуру соседней', () => {
    const grid = layouts({ lg: 'a a b : c d e', md: '', sm: '' }, 5, 3);
    expect(grid.lg?.cells.find((cell) => cell.name === 'a')).toMatchObject({ width: 4 });
    // на среднем экране своя фигура, а не растянутая карточка с большого
    expect(grid.md?.cells.every((cell) => cell.width === 2)).toBe(true);
  });
});
