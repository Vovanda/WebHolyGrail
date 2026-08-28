import { describe, expect, it } from 'vitest';

import { completeLayout, layout, layoutAreas, tileName } from './grid-areas';

describe('имена плиток', () => {
  it('идут по алфавиту от места в блоке', () => {
    expect(tileName(0)).toBe('a');
    expect(tileName(1)).toBe('b');
    expect(tileName(25)).toBe('z');
  });

  it('после двадцать шестой удваиваются, а не обрываются', () => {
    expect(tileName(26)).toBe('aa');
    expect(tileName(27)).toBe('ab');
  });
});

describe('достройка записи', () => {
  it('пустое поле: всю фигуру строит сам', () => {
    expect(completeLayout('', 8, 3)).toBe('a b c : d e : f g h');
    expect(completeLayout(null, 9, 3)).toBe('a b c : d e f : g h i');
    expect(completeLayout(undefined, 4, 3)).toBe('a b : c d');
  });

  it('заданное остаётся как есть, хвост дописывается следом', () => {
    // владелец описал пять плиток, в блоке девять: четыре оставшихся ложатся сами
    expect(completeLayout('a b c e : a b d d', 9, 3)).toBe('a b c e : a b d d : f g : h i');
  });

  it('хвост считается от вместимости блока, а не от ширины заданной фигуры', () => {
    // сверху четыре в ряду, а хвост всё равно раскладывается по три
    expect(completeLayout('a b c d', 10, 3)).toBe('a b c d : e f g : h i j');
  });

  it('пропущенные в начале плитки достраиваются под заданным', () => {
    // владелец назвал шестую, восьмую и седьмую - первые пять встают ниже
    expect(completeLayout('f h g', 9, 3)).toBe('f h g : a b c : d e i');
  });

  it('заданного хватило на всё - дописывать нечего', () => {
    expect(completeLayout('a b : c d', 4, 3)).toBe('a b : c d');
  });

  it('негодная запись игнорируется целиком, фигура строится сама', () => {
    // имя вразброс: такой фигуры не бывает, и держаться за неё незачем
    expect(completeLayout('a b : b a', 4, 3)).toBe('a b : c d');
  });

  it('плиток нет - и записи нет', () => {
    expect(completeLayout('a b', 0, 3)).toBeNull();
  });
});

describe('области всей сетки', () => {
  it('заданное и доложенное приходят одной фигурой', () => {
    const areas = layoutAreas('a b c e : a b d d', 9, 3);
    expect(areas?.map((area) => area.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);

    // первая тянется через два ряда - так её и написал владелец
    expect(areas?.find((area) => area.name === 'a')).toMatchObject({ height: 2, width: 1 });
    // четвёртая занимает две колонки во втором ряду
    expect(areas?.find((area) => area.name === 'd')).toMatchObject({ row: 2, width: 2 });
    // доложенные встают ниже заданного
    expect(areas?.find((area) => area.name === 'f')?.row).toBe(3);
  });
});

describe('раскладка в долях', () => {
  it('короткий ряд встаёт по центру', () => {
    const grid = layout('', 8, 3);
    expect(grid?.columns).toBe(6);

    // первый ряд из трёх: плитки идут подряд с первой доли
    expect(grid?.cells.find((cell) => cell.name === 'a')).toMatchObject({ column: 1, width: 2 });
    expect(grid?.cells.find((cell) => cell.name === 'c')).toMatchObject({ column: 5, width: 2 });

    // средний ряд из двух: свободная колонка разошлась по краям
    expect(grid?.cells.find((cell) => cell.name === 'd')).toMatchObject({ column: 2, row: 2 });
    expect(grid?.cells.find((cell) => cell.name === 'e')).toMatchObject({ column: 4, row: 2 });
  });

  it('полный ряд не сдвигается', () => {
    const grid = layout('', 9, 3);
    expect(grid?.cells.every((cell) => [1, 3, 5].includes(cell.column))).toBe(true);
  });

  it('одинокая плитка в хвосте стоит посередине', () => {
    const grid = layout('a b c d', 5, 4);
    // пятая одна в своём ряду: из восьми долей она занимает две в середине
    expect(grid?.columns).toBe(8);
    expect(grid?.cells.find((cell) => cell.name === 'e')).toMatchObject({
      column: 4,
      row: 2,
      width: 2,
    });
  });

  it('заданные размеры доходят до долей', () => {
    const grid = layout('a b c e : a b d d', 5, 3);
    // первая тянется через два ряда и занимает одну колонку - две доли
    expect(grid?.cells.find((cell) => cell.name === 'a')).toMatchObject({
      column: 1,
      row: 1,
      width: 2,
      height: 2,
    });
    // четвёртая занимает две колонки - четыре доли
    expect(grid?.cells.find((cell) => cell.name === 'd')).toMatchObject({ width: 4, row: 2 });
  });
});

describe('плитка на несколько рядов и короткий ряд', () => {
  it('ряд с высокой плиткой не сдвигается: иначе плитки налезают друг на друга', () => {
    // третий ряд короче на одну, но в нём стоит «a» высотой в два ряда
    const grid = layout('b c d e : f a a g : h a a', 8, 4);
    const cells = new Map(grid?.cells.map((cell) => [cell.name, cell]));

    const a = cells.get('a');
    const h = cells.get('h');
    expect(a).toMatchObject({ column: 3, row: 2, width: 4, height: 2 });
    // «h» стоит слева, а не под серединой: иначе оно оказалось бы под «a»
    expect(h).toMatchObject({ column: 1, row: 3 });
    // области не пересекаются по долям
    expect((h?.column ?? 0) + (h?.width ?? 0)).toBeLessThanOrEqual(a?.column ?? 0);
  });
});
