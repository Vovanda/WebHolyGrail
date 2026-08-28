/**
 * Раскладка карточек по рядам без сироты в конце.
 *
 * @remarks
 * Сетка с постоянным числом колонок добирает остаток последним рядом: четыре
 * карточки при трёх колонках дают три и одну, и рядом с одинокой карточкой
 * зияет пустота во всю ширину.
 *
 * Рядов берётся наименьшее возможное число, а остаток раздаётся так, чтобы
 * фигура читалась одинаково сверху вниз: 3 2 3, 2 3 2, 3 2 2 3. Симметрия
 * важнее ровности - ступенька вида 3 2 2 выглядит как «не хватило», а ромб
 * 2 3 2 как задуманное.
 *
 * Когда симметричных раскладок несколько, длинные ряды уходят к краям:
 * из десяти при трёх в ряду выходит 3 2 2 3, а не 2 3 3 2. Края держат ширину
 * блока, а узкий верх читается так, будто сетка начинается вяло и потом
 * расширяется рывком.
 *
 * Симметрия выходит не всегда: пять при трёх в ряду это 3 2, и палиндрома
 * из пяти в два ряда не существует вовсе. Тогда длинный ряд идёт первым.
 */
export function balancedRows(count: number, maxColumns: number): number[] {
  if (count <= 0 || maxColumns <= 0) return [];
  if (count <= maxColumns) return [count];

  const rows = Math.ceil(count / maxColumns);
  const base = Math.floor(count / rows);
  const lengths = Array.from({ length: rows }, () => base);

  let rest = count - base * rows;

  /*
    Нечётный остаток при нечётном числе рядов уходит в середину: так из семи
    выходит 2 3 2, а не 3 2 2. Дальше остаток ложится парами к краям, отчего
    длинные ряды и оказываются снаружи: 3 2 3, 3 2 2 3.
  */
  const middle = (rows - 1) / 2;
  if (rest % 2 === 1 && rows % 2 === 1) {
    lengths[middle]! += 1;
    rest -= 1;
  }

  for (let pair = 0; rest >= 2; pair += 1) {
    const head = pair;
    const tail = rows - 1 - pair;
    if (head >= tail) break;
    lengths[head]! += 1;
    lengths[tail]! += 1;
    rest -= 2;
  }

  /*
    Чётное число рядов остаток пополам не делит, и симметрии там не выйдет
    никак. Кладём добавку ближе к середине, чтобы фигура хотя бы не заваливалась
    на край.
  */
  for (let at = Math.floor(rows / 2) - 1; rest > 0 && at >= 0; at -= 1) {
    lengths[at]! += 1;
    rest -= 1;
  }

  return lengths;
}

/**
 * Те же ряды, но карточками: удобно раскладывать готовый список.
 */
export function splitIntoRows<T>(items: readonly T[], maxColumns: number): T[][] {
  const rows: T[][] = [];
  let offset = 0;
  for (const length of balancedRows(items.length, maxColumns)) {
    rows.push(items.slice(offset, offset + length));
    offset += length;
  }
  return rows;
}
