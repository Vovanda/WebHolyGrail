import { balancedRows } from './grid-rows';

/**
 * Раскладка плиток именами областей: «a b : a c».
 *
 * @remarks
 * Запись повторяет grid-template-areas, только ряды разделены двоеточием, а не
 * кавычками: в поле админки так короче и ничего не приходится экранировать.
 *
 * Имена дают то, чего не дают ширины: плитка, занявшая одну колонку в двух
 * рядах, описывается сама собой - «a b : a c».
 *
 * Точка означает пустое место, как в CSS. Обычно пустых мест мы не хотим, но
 * если дизайнер поставил её сам - это его решение, а не случайная дырка.
 *
 * Имя означает номер плитки: «a» это первая, «b» вторая и так далее по алфавиту.
 * Поэтому им задаётся и порядок: дизайнер, который хочет увести четвёртую вниз,
 * а пятую поднять наверх, пишет «a b c e : a b d d» - и плитки встают именно
 * так, хотя в блоке их порядок не менялся.
 *
 * Повтор записывается числом перед именем: «3a» это то же, что «a a a». На
 * широкой плитке так короче, на мелкой фигуре понятнее полная запись - берём
 * обе.
 */

/** Место плитки в сетке: с какой колонки и строки начинается и сколько занимает. */
export interface Area {
  readonly name: string;
  readonly column: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

/** Пустое место. */
const HOLE = '.';

/**
 * Развернуть повторы: «3a» превращается в три ячейки «a».
 *
 * @remarks
 * Число без имени пропускаем: «3» само по себе ничего не называет, и угадывать
 * за человека имя не стоит.
 */
function expand(cells: ReadonlyArray<string>): ReadonlyArray<string> {
  return cells.flatMap((cell) => {
    const short = cell.match(/^(\d+)(.+)$/);
    if (!short) return [cell];

    const times = Number(short[1]);
    const name = short[2] as string;
    if (!Number.isInteger(times) || times < 1) return [cell];

    return Array.from({ length: times }, () => name);
  });
}

/**
 * Разбор записи в области.
 *
 * @remarks
 * Отбрасываем целиком, если запись не складывается в сетку: ряды разной длины
 * или имя разбросано так, что его область не прямоугольник. Молча уронить
 * фигуру хуже, чем не взять её - человек хотя бы увидит, что раскладка
 * не применилась.
 */
export function parseAreas(raw: string | null | undefined): ReadonlyArray<Area> | null {
  if (!raw) return null;

  const rows = raw
    .split(':')
    .map((row) =>
      expand(
        row
          .trim()
          .split(/[\s,]+/)
          .filter(Boolean),
      ),
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) return null;

  /*
    Ряды бывают разной длины: 3 2 3 это «a b c : d e : f g h», и короткий ряд
    встаёт по центру своей строки. В CSS так записать нельзя - grid-template-areas
    требует строки одной длины, - поэтому запись в разметку дословно не уходит:
    позиции считаются здесь, а сетка получает их числами.
  */

  // Имя - буква: ею названа плитка по счёту в блоке. Всё прочее не имя, и гадать,
  // что человек имел в виду, не стоит.
  if (rows.some((row) => row.some((cell) => cell !== HOLE && !/^[a-zA-Z]+$/.test(cell)))) {
    return null;
  }

  const seen = new Map<string, { top: number; left: number; bottom: number; right: number }>();

  rows.forEach((row, y) => {
    row.forEach((name, x) => {
      if (name === HOLE) return;

      const box = seen.get(name);
      if (!box) {
        seen.set(name, { top: y, left: x, bottom: y, right: x });
        return;
      }

      box.top = Math.min(box.top, y);
      box.left = Math.min(box.left, x);
      box.bottom = Math.max(box.bottom, y);
      box.right = Math.max(box.right, x);
    });
  });

  if (seen.size === 0) return null;

  // Область каждого имени должна быть цельным прямоугольником: «a b : b a»
  // описывает фигуру, которой не бывает.
  for (const [name, box] of seen) {
    for (let y = box.top; y <= box.bottom; y += 1) {
      for (let x = box.left; x <= box.right; x += 1) {
        if (rows[y]?.[x] !== name) return null;
      }
    }
  }

  // По имени, а не по появлению в строке: имя означает номер плитки, и именно
  // им дизайнер переставляет карточки местами.
  return (
    [...seen.keys()]
      // Сперва по длине, потом по алфавиту: после «z» имена удваиваются, и простое
      // сравнение строк поставило бы «aa» перед «b», перепутав порядок карточек.
      .sort((left, right) => left.length - right.length || left.localeCompare(right))
      .map((name) => {
        const box = seen.get(name) as { top: number; left: number; bottom: number; right: number };
        return {
          name,
          column: box.left + 1,
          row: box.top + 1,
          width: box.right - box.left + 1,
          height: box.bottom - box.top + 1,
        };
      })
  );
}

/**
 * Сколько колонок в записанной сетке.
 *
 * @remarks
 * По самому длинному ряду, а не по первому: ряды бывают разной длины, и ширину
 * задаёт тот, что шире всех - в него и вписываются остальные.
 */
export function areasWidth(raw: string | null | undefined): number | null {
  const rows = raw
    ?.split(':')
    .map((row) =>
      expand(
        row
          .trim()
          .split(/[\s,]+/)
          .filter(Boolean),
      ),
    )
    .filter((row) => row.length > 0);
  if (!rows || rows.length === 0) return null;

  return Math.max(...rows.map((row) => row.length));
}

/**
 * Имя плитки по её месту в блоке: первая - «a», вторая - «b».
 *
 * @remarks
 * После двадцать шестой имена удваиваются - «aa», «ab». Блоков с таким числом
 * плиток мы не видели, но обрывать счёт на «z» значило бы молча потерять
 * карточки.
 */
export function tileName(index: number): string {
  let rest = index;
  let name = '';

  do {
    name = String.fromCharCode(97 + (rest % 26)) + name;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);

  return name;
}

/**
 * Достроить запись до полной: то, чего владелец не описал, доложить самим.
 *
 * @remarks
 * Порядок такой: берём имена всех плиток блока, вычитаем те, что владелец уже
 * поставил, оставшиеся раскладываем сбалансированными рядами и дописываем
 * следом за заданным.
 *
 * Хвост считается сам по себе, от вместимости ряда у блока, а не от ширины
 * написанной фигуры: владелец описывает начало, а не задаёт ритм всему
 * остальному.
 *
 * Имена оставшихся идут по алфавиту - иначе плитки встали бы не на свои места:
 * имя означает номер карточки в блоке.
 */
export function completeLayout(
  raw: string | null | undefined,
  count: number,
  perRow: number,
): string | null {
  if (count <= 0) return null;

  const all = Array.from({ length: count }, (_unused, index) => tileName(index));
  const taken = new Set((parseAreas(raw) ?? []).map((area) => area.name));
  const free = all.filter((name) => !taken.has(name));

  const rows: string[] = [];
  const asked = parseAreas(raw) ? raw?.trim() : null;
  if (asked) rows.push(asked);

  let offset = 0;
  for (const length of balancedRows(free.length, Math.max(1, Math.floor(perRow)))) {
    rows.push(free.slice(offset, offset + length).join(' '));
    offset += length;
  }

  return rows.length > 0 ? rows.join(' : ') : null;
}

/**
 * Области всех плиток блока: заданные владельцем и доложенные самими.
 *
 * @remarks
 * То, что уходит в разметку. Заданное и доложенное к этому месту уже неразличимы -
 * сетка получает одну фигуру.
 */
export function layoutAreas(
  raw: string | null | undefined,
  count: number,
  perRow: number,
): ReadonlyArray<Area> | null {
  return parseAreas(completeLayout(raw, count, perRow));
}

/** Место плитки в сетке, готовое для разметки: доли, а не ячейки записи. */
export interface Cell {
  readonly name: string;
  /** С какой доли начинается, считая от единицы. */
  readonly column: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
}

/** Раскладка блока целиком: плитки и во сколько долей их класть. */
export interface Layout {
  readonly cells: ReadonlyArray<Cell>;
  /** Сколько долей в сетке: вдвое больше колонок записи. */
  readonly columns: number;
}

/**
 * Раскладка, готовая к разметке: короткий ряд стоит по центру.
 *
 * @remarks
 * Сетка считается в половинных долях - долей вдвое больше, чем колонок,
 * а плитка занимает две. Иначе короткий ряд не поставить по центру: при трёх
 * колонках ряд из двух оставляет одну свободную, а половину колонки не занять.
 * В долях свободных остаётся две, по одной с каждого края, и ряд встаёт ровно
 * посередине.
 *
 * Плитка, растянутая через ряды разной длины, берёт наименьший сдвиг из своих -
 * так она не вылезает за край сетки.
 */
export function layout(
  raw: string | null | undefined,
  count: number,
  perRow: number,
): Layout | null {
  const record = completeLayout(raw, count, perRow);
  const areas = parseAreas(record);
  if (!areas || !record) return null;

  const width = areasWidth(record) ?? 0;
  if (width <= 0) return null;

  const lengths = record
    .split(':')
    .map(
      (row) =>
        expand(
          row
            .trim()
            .split(/[\s,]+/)
            .filter(Boolean),
        ).length,
    )
    .filter((length) => length > 0);

  /*
    Ряд, в котором стоит плитка на несколько рядов, не сдвигается: сдвинуть его
    к центру значило бы развести соседние ряды одной плитки по разным местам,
    и она налезла бы на чужие. Такой ряд остаётся слева, а пустое место копится
    у края - это заметно, но целая фигура важнее.
  */
  const tall = new Set<number>();
  for (const area of areas) {
    if (area.height <= 1) continue;
    for (let row = area.row; row < area.row + area.height; row += 1) tall.add(row);
  }

  const cells = areas.map((area) => {
    let shift = Number.POSITIVE_INFINITY;
    for (let row = area.row; row < area.row + area.height; row += 1) {
      shift = Math.min(shift, tall.has(row) ? 0 : width - (lengths[row - 1] ?? width));
    }

    return {
      name: area.name,
      column: (area.column - 1) * 2 + (Number.isFinite(shift) ? shift : 0) + 1,
      row: area.row,
      width: area.width * 2,
      height: area.height,
    };
  });

  return { cells, columns: width * 2 };
}
