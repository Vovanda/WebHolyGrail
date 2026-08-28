/**
 * Раскладка карточек по рядам без сироты в конце.
 *
 * @remarks
 * Сетка с постоянным числом колонок добирает остаток последним рядом: четыре
 * карточки при трёх колонках дают три и одну, и рядом с одинокой карточкой
 * зияет пустота во всю ширину.
 *
 * Здесь рядов берётся наименьшее возможное число, а карточки раздаются по ним
 * поровну: каждому ряду целая часть, остаток - с краёв, сперва первому ряду,
 * потом последнему, потом второму, предпоследнему и так внутрь. Раздача с краёв
 * и даёт из восьми три, два и три: длинные ряды по краям, короткий посередине.
 */
export function balancedRows(count: number, maxColumns: number): number[] {
  if (count <= 0 || maxColumns <= 0) return [];
  if (count <= maxColumns) return [count];

  const rows = Math.ceil(count / maxColumns);
  const base = Math.floor(count / rows);
  const lengths = Array.from({ length: rows }, () => base);

  /*
    Остаток раздаётся симметрично: индексы идут с обоих концов к середине -
    0, последний, 1, предпоследний и так далее. При нечётном числе рядов
    середина получает добавку последней, поэтому короткий ряд остаётся внутри.
  */
  let rest = count - base * rows;
  const order: number[] = [];
  for (let left = 0, right = rows - 1; left <= right; left++, right--) {
    order.push(left);
    if (right !== left) order.push(right);
  }
  for (let i = 0; rest > 0; i++, rest--) {
    lengths[order[i % order.length]!]! += 1;
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
