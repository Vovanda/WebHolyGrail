import { describe, expect, it } from 'vitest';

import { areasWidth, parseAreas, type Area } from './grid-areas';

/**
 * Раскладка именами описывает и вертикальное объединение, но допускает фигуры,
 * которых не бывает. Такую запись лучше не взять вовсе, чем показать криво.
 */

describe('разбор областей', () => {
  it('плитка занимает колонку в двух рядах', () => {
    expect(parseAreas('a b : a c')).toEqual([
      { name: 'a', column: 1, row: 1, width: 1, height: 2 },
      { name: 'b', column: 2, row: 1, width: 1, height: 1 },
      { name: 'c', column: 2, row: 2, width: 1, height: 1 },
    ]);
  });

  it('плитка растягивается по горизонтали', () => {
    expect(parseAreas('a a : b c')?.[0]).toEqual({
      name: 'a',
      column: 1,
      row: 1,
      width: 2,
      height: 1,
    });
  });

  it('точка оставляет пустое место', () => {
    const areas = parseAreas('a . : b c');
    expect(areas?.map((a: Area) => a.name)).toEqual(['a', 'b', 'c']);
  });

  it('порядок плиток - по имени: им дизайнер и переставляет карточки', () => {
    expect(parseAreas('b a : b a')?.map((a: Area) => a.name)).toEqual(['a', 'b']);
  });

  it('пример владельца: четвёртая уходит вниз, пятая встаёт наверх', () => {
    const areas = parseAreas('a b c e : a b d d');

    expect(areas?.map((a: Area) => a.name)).toEqual(['a', 'b', 'c', 'd', 'e']);
    // Четвёртая плитка легла во второй ряд и заняла две колонки.
    expect(areas?.find((a: Area) => a.name === 'd')).toEqual({
      name: 'd',
      column: 3,
      row: 2,
      width: 2,
      height: 1,
    });
    // Пятая осталась в первом ряду справа.
    expect(areas?.find((a: Area) => a.name === 'e')?.row).toBe(1);
  });
});

describe('сокращённая запись', () => {
  it('число перед именем повторяет его', () => {
    expect(parseAreas('2a : 2b')).toEqual(parseAreas('a a : b b'));
  });

  it('мешается с полной в одной строке', () => {
    expect(parseAreas('2a : b c')).toEqual(parseAreas('a a : b c'));
  });

  it('ширина считается по развёрнутому ряду', () => {
    expect(areasWidth('3a : b c d')).toBe(3);
  });

  it('число без имени остаётся как есть и сетку ломает', () => {
    expect(parseAreas('3 : b c d')).toBeNull();
  });
});

describe('запись не складывается в сетку', () => {
  it('ряды разной длины отбрасываются', () => {
    expect(parseAreas('a b : c')).toBeNull();
  });

  it('имя вразброс отбрасывается: такой фигуры не бывает', () => {
    expect(parseAreas('a b : b a')).toBeNull();
    expect(parseAreas('a a : b c : a b')).toBeNull();
  });

  it('пусто и мусор дают пусто', () => {
    expect(parseAreas('')).toBeNull();
    expect(parseAreas(null)).toBeNull();
    expect(parseAreas('. . : . .')).toBeNull();
  });
});

describe('ширина сетки', () => {
  it('считается по первому ряду', () => {
    expect(areasWidth('a b c : d e f')).toBe(3);
    expect(areasWidth('')).toBeNull();
  });
});
