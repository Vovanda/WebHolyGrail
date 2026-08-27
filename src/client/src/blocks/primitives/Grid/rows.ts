/**
 * Как разложить плитки по рядам, чтобы не осталось пустых мест.
 *
 * @remarks
 * Сетка, у которой в последнем ряду болтается одинокая карточка, читается как
 * недоделанная. Поэтому ряды подбираются так, чтобы каждый был заполнен
 * целиком, а длины различались не больше чем на одну плитку.
 *
 * Ряды разной длины - это нормально, важно другое: фигура должна читаться
 * симметрично сверху вниз. 3 2 3 и 4 5 4 выглядят уравновешенно, а 3 3 2 и
 * 5 4 4 - нет, взгляд спотыкается о ступеньку с одной стороны.
 *
 * Поэтому остаток раздаётся симметрично: нечётный - середине, чётный - парами
 * к краям. Карточки при этом не растягиваются: подбирается плотность, а не
 * ширина плитки.
 *
 * Считается от вместимости ряда, а не одной раскладкой на все случаи: на узком
 * экране в ряд помещается двое, и там правильный ответ 2 2 2.
 */

/** Меньше двух в ряду не ставим: это уже не сетка, а список. */
const MIN_PER_ROW = 2;

/**
 * Длины рядов для такого количества плиток.
 *
 * @param count - сколько плиток всего
 * @param perRow - сколько помещается в ряд при этой ширине
 */
export function gridRows(count: number, perRow: number): ReadonlyArray<number> {
  if (count <= 0) return [];

  const max = Math.max(MIN_PER_ROW, Math.floor(perRow));
  if (count <= max) return [count];

  // Рядов берём столько, чтобы плитки легли плотнее: меньше рядов - ближе
  // к прямоугольнику.
  const rows = Math.ceil(count / max);

  const base = Math.floor(count / rows);
  const lengths = Array.from({ length: rows }, () => base);

  /*
    Остаток раздаём так, чтобы получился палиндром. Нечётная плитка идёт
    в середину: 4 5 4 читается ровно, а 5 4 4 заваливается влево. Остальные
    ложатся парами к краям: 3 2 3, а не 3 3 2.
  */
  let left = count % rows;
  const middle = (rows - 1) / 2;

  if (left % 2 === 1 && rows % 2 === 1) {
    lengths[middle] = (lengths[middle] ?? base) + 1;
    left -= 1;
  }

  for (let pair = 0; left >= 2; pair += 1) {
    const head = pair;
    const tail = rows - 1 - pair;
    if (head >= tail) break;

    lengths[head] = (lengths[head] ?? base) + 1;
    lengths[tail] = (lengths[tail] ?? base) + 1;
    left -= 2;
  }

  // Ряды чётной высоты остаток пополам не делят: кладём его ближе к середине,
  // чтобы фигура всё равно не заваливалась на край.
  for (let at = Math.floor(rows / 2) - 1; left > 0 && at >= 0; at -= 1) {
    lengths[at] = (lengths[at] ?? base) + 1;
    left -= 1;
  }

  return lengths;
}

/** Плитка в раскладке: сколько колонок занимает. */
export type Span = number;

/**
 * Раскладка, заданная руками: «2 1 : 1 1 1 1».
 *
 * @remarks
 * Автоматический подбор угадывает не всегда: иногда нужна ровно своя фигура -
 * например широкая плитка в углу и четыре обычных под ней.
 *
 * Ряды разделяются двоеточием, внутри ряда - ширина каждой плитки в колонках.
 * Число плиток видно по количеству чисел, а растяжение читается самим числом.
 *
 * Именованные области, как в grid-template-areas, отпадают: одно имя в несмежных
 * местах даёт несвязную фигуру, которую пришлось бы ловить и объяснять человеку.
 * Ширины такого не разрешают вовсе. Плата - вертикальным объединением так не
 * опишешь; понадобится, добавим отдельно.
 *
 * Раскладка описывает начало, а не всю сетку: задал «3 2 3», а плиток больше -
 * первые ряды лягут как сказано, остальные досчитаются сами по общему правилу.
 * Так строку не приходится править каждый раз, когда добавили плитку.
 *
 * Мусор отбрасываем целиком: раскладка, из которой непонятно, что делать,
 * хуже, чем её отсутствие.
 */
export function parseLayout(
  raw: string | null | undefined,
): ReadonlyArray<ReadonlyArray<Span>> | null {
  if (!raw) return null;

  const rows = raw
    // Человек пишет как удобно: лишние пробелы по краям и подряд идущие
    // схлопываются, запятая годится наравне с пробелом.
    .split(':')
    .map((row) =>
      row
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number),
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) return null;
  if (rows.some((row) => row.some((span) => !Number.isInteger(span) || span < 1))) return null;

  return rows;
}

/**
 * Разложить сами плитки по рядам.
 *
 * @param custom - раскладка владельца; пусто - считаем сами
 */
/** Плитка с шириной: сколько колонок она занимает в своём ряду. */
export interface PlacedTile<T> {
  readonly item: T;
  readonly span: Span;
}

/**
 * Разложить плитки по рядам.
 *
 * @param custom - раскладка руками; пусто - считаем сами
 */
export function splitIntoRows<T>(
  items: ReadonlyArray<T>,
  perRow: number,
  custom?: string | null,
): ReadonlyArray<ReadonlyArray<PlacedTile<T>>> {
  /*
    Заданная раскладка берётся, пока её ряды помещаются по ширине: на узком
    экране четыре колонки не влезут, и держаться за фигуру значило бы ломать
    показ.
  */
  const asked = parseLayout(custom)?.filter(
    (row) => row.reduce((sum, span) => sum + span, 0) <= perRow,
  );

  const layout: Array<ReadonlyArray<Span>> = [];
  let placed = 0;

  for (const row of asked ?? []) {
    if (placed >= items.length) break;
    // Последний заданный ряд может оказаться шире остатка: лишние места
    // отбрасываем, иначе в сетке появятся дырки.
    const room = Math.min(row.length, items.length - placed);
    layout.push(row.slice(0, room));
    placed += room;
  }

  // Остаток раскладываем общим правилом: строку не должны править каждый раз,
  // когда в блок добавили плитку.
  for (const length of gridRows(items.length - placed, perRow)) {
    layout.push(Array.from({ length }, () => 1));
  }

  const rows: Array<ReadonlyArray<PlacedTile<T>>> = [];
  let at = 0;

  for (const row of layout) {
    rows.push(
      row.map((span) => {
        const item = items[at] as T;
        at += 1;
        return { item, span };
      }),
    );
  }

  return rows;
}
