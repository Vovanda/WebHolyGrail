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
  /** Какая это карточка по счёту: место имени среди остальных, по алфавиту. */
  readonly index: number;
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
/**
 * Ряд в отдельные ячейки.
 *
 * @remarks
 * Пробелы не обязательны: имя это один знак, точка - одно пустое место, число
 * перед именем - повтор. Поэтому «a b c», «abc» и «3a» разбираются одинаково
 * уверенно, а человек пишет как ему удобно.
 *
 * Имена однобуквенные нарочно. Слитную запись иначе не прочесть: «aa» - это две
 * плитки или двадцать седьмая? После «z» идут заглавные, и этого хватает
 * на полсотни плиток в одном блоке.
 */
function cells(
  row: string,
): { ok: ReadonlyArray<string>; off: ReadonlyArray<string> } | { bad: string } {
  const out: string[] = [];
  const off: string[] = [];

  for (const chunk of row.trim().split(/\s+/).filter(Boolean)) {
    let rest = chunk;

    while (rest) {
      const hidden = rest.startsWith('-');
      if (hidden) rest = rest.slice(1);

      const found = rest.match(/^(\d*)(.)/);
      if (!found) return { bad: `«${chunk}» - число ничего не называет` };

      const times = found[1] ? Number(found[1]) : 1;
      const knak = found[2] as string;
      rest = rest.slice(found[0].length);

      if (!Number.isInteger(times) || times < 1) return { bad: `«${chunk}» - негодный повтор` };
      if (hidden && found[1]) {
        return { bad: `«${chunk}» - у выключенной карточки размера нет` };
      }
      if (knak !== HOLE && !/^[a-zA-Z]$/.test(knak)) {
        return { bad: `«${knak}» - имя пишется буквой` };
      }

      /*
        Выключенная карточка места не занимает, но из счёта не выпадает: её имя
        участвует в порядке наравне с остальными, иначе соседи поехали бы
        номерами. В ряд она просто не попадает.
      */
      if (hidden) {
        off.push(knak);
        continue;
      }

      for (let at = 0; at < times; at += 1) out.push(knak);
    }
  }

  return { ok: out, off };
}

function expand(cells: ReadonlyArray<string>): ReadonlyArray<string> {
  return cells.flatMap((cell) => {
    // Точка - один знак, одно место. Написанные слитно считаются каждая за своё:
    // «.....» это пять пустых мест, а не имя из точек.
    if (/^\.+$/.test(cell)) return Array.from({ length: cell.length }, () => HOLE);

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
/*
  Номера выключенных карточек, по записи. Разбор проходит запись один раз, а
  достройке нужно знать, кого не досчитывать: без этого выключенная вернулась бы
  хвостом, как будто её просто забыли назвать.
*/
const hiddenByRecord = new Map<string, ReadonlySet<number>>();

/** Какие карточки выключены этой записью. */
export function hiddenTiles(raw: string | null | undefined): ReadonlySet<number> {
  if (!raw) return new Set();
  parseAreas(raw);
  return hiddenByRecord.get(raw) ?? new Set();
}

export function parseAreas(raw: string | null | undefined): ReadonlyArray<Area> | null {
  if (!raw) return null;

  /*
    Решётка в начале выключает запись, не стирая её: фигура не применяется, текст
    остаётся на месте. Так сравнивают «с фигурой и без», не набирая строку заново.
  */
  if (raw.trim().startsWith('#')) return null;

  const read = raw.split(':').map((row) => cells(row));
  if (read.some((row) => 'bad' in row)) return null;

  const rows = read.map((row) => ('ok' in row ? row.ok : [])).filter((row) => row.length > 0);

  // Выключенные участвуют только в порядке имён, в сетку они не идут.
  const off = new Set(read.flatMap((row) => ('off' in row ? row.off : [])));

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

  /*
    Порядок имён и есть порядок карточек: первое по алфавиту имя означает первую
    карточку блока, второе - вторую. Само имя роли не играет, важно его место
    среди остальных.

    Выключенные имена в этот порядок входят наравне с видимыми - иначе соседи
    поехали бы номерами, стоило кому-то выключиться.
  */
  const order = [...new Set([...seen.keys(), ...off])].sort((left, right) =>
    left.localeCompare(right),
  );

  hiddenByRecord.set(
    raw,
    new Set(order.map((name, index) => (seen.has(name) ? -1 : index)).filter((at) => at >= 0)),
  );

  return order
    .filter((name) => seen.has(name))
    .map((name) => {
      const box = seen.get(name) as { top: number; left: number; bottom: number; right: number };
      return {
        name,
        index: order.indexOf(name),
        column: box.left + 1,
        row: box.top + 1,
        width: box.right - box.left + 1,
        height: box.bottom - box.top + 1,
      };
    });
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

  /*
    Ряд без единого имени в ширине не участвует: точки уточняют положение имён,
    а уточнять там нечего - остаётся только высота пустой строки. Иначе длинная
    строка точек раздувала бы всю сетку.
  */
  const named = rows.filter((row) => row.some((cell) => cell !== HOLE));

  return Math.max(...(named.length > 0 ? named : rows).map((row) => row.length));
}

/**
 * Места всех карточек блока: заданные владельцем и досчитанные.
 *
 * @remarks
 * Заданное разбирается из записи, остальное досчитывается сразу местами, а не
 * дописывается в текст. Текст - только вход от человека: в нём имя занимает один
 * знак, и на полусотне карточек имена кончаются. Досчитывать через него значило
 * бы упереться в алфавит там, где карточек тысяча, хотя человек такую сетку
 * и не пишет руками.
 *
 * Досчитанное встаёт под заданным, сбалансированными рядами - тем же правилом,
 * что и сетка без записи вовсе.
 */
export function placeAll(
  raw: string | null | undefined,
  count: number,
  perRow: number,
): { readonly areas: ReadonlyArray<Area>; readonly rows: ReadonlyArray<number> } | null {
  if (count <= 0) return null;

  const asked = parseAreas(raw) ?? [];
  const width = areasWidth(raw) ?? 0;
  const taken = new Set([...asked.map((area) => area.index), ...hiddenTiles(raw)]);

  const askedRows = asked.reduce((most, area) => Math.max(most, area.row + area.height - 1), 0);
  const rows: number[] = [];
  for (let row = 1; row <= askedRows; row += 1) {
    rows.push(
      asked
        .filter((area) => area.row <= row && row < area.row + area.height)
        .reduce((sum, area) => sum + area.width, 0),
    );
  }

  const free: number[] = [];
  for (let index = 0; index < count; index += 1) {
    if (!taken.has(index)) free.push(index);
  }

  const areas: Area[] = [...asked];
  let offset = 0;
  let row = askedRows;

  for (const length of balancedRows(free.length, Math.max(1, Math.floor(perRow)))) {
    row += 1;
    rows.push(length);
    for (let at = 0; at < length; at += 1) {
      const index = free[offset + at];
      if (index === undefined) break;
      /*
        Досчитанной карточке имя не нужно: назвать её человек не просил, а имена
        на большом наборе кончились бы. Ей хватает номера.
      */
      areas.push({ name: '', index, column: at + 1, row, width: 1, height: 1 });
    }
    offset += length;
  }

  return { areas, rows: rows.length > 0 ? rows : [Math.max(width, 1)] };
}

/** Место плитки в сетке, готовое для разметки: доли, а не ячейки записи. */
export interface Cell {
  readonly name: string;
  /** Номер карточки по счёту. */
  readonly index: number;
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
 * Сетка считается в половинных долях - долей вдвое больше, чем колонок, а
 * карточка занимает две. Иначе короткий ряд не поставить по центру: при трёх
 * колонках ряд из двух оставляет одну свободную, а половину колонки не занять.
 *
 * Ряд, в котором стоит карточка на несколько рядов, не сдвигается: сдвинуть его
 * к центру значило бы развести её соседние ряды по разным местам, и она налезла
 * бы на чужие.
 */
export function layout(
  raw: string | null | undefined,
  count: number,
  perRow: number,
): Layout | null {
  const placed = placeAll(raw, count, perRow);
  if (!placed) return null;

  const width = Math.max(...placed.rows, 1);

  const tall = new Set<number>();
  for (const area of placed.areas) {
    if (area.height <= 1) continue;
    for (let row = area.row; row < area.row + area.height; row += 1) tall.add(row);
  }

  const cells = placed.areas.map((area) => {
    let shift = Number.POSITIVE_INFINITY;
    for (let row = area.row; row < area.row + area.height; row += 1) {
      shift = Math.min(shift, tall.has(row) ? 0 : width - (placed.rows[row - 1] ?? width));
    }

    return {
      name: area.name,
      index: area.index,
      column: (area.column - 1) * 2 + (Number.isFinite(shift) ? shift : 0) + 1,
      row: area.row,
      width: area.width * 2,
      height: area.height,
    };
  });

  return { cells, columns: width * 2 };
}

/** Раскладки блока на все ширины. */
export interface Layouts {
  readonly lg: Layout | null;
  readonly md: Layout | null;
  readonly sm: Layout | null;
}

/**
 * Раскладки на три ширины: широкий экран, планшет, телефон.
 *
 * @remarks
 * Каждая ширина считается отдельно и своей вместимостью: на широком в ряд
 * помещается столько, сколько задал блок, на планшете двое, на телефоне один.
 *
 * Незаполненная запись не наследуется от соседней: фигура, придуманная для
 * четырёх колонок, на телефоне раздавила бы карточки. Пусто означает «посчитай
 * сама», и правило подбора там то же самое.
 */
export function layouts(
  raw: {
    readonly lg?: string | null | undefined;
    readonly md?: string | null | undefined;
    readonly sm?: string | null | undefined;
  },
  count: number,
  perRow: number,
): Layouts {
  return {
    lg: layout(raw.lg, count, perRow),
    md: layout(raw.md, count, 2),
    sm: layout(raw.sm, count, 1),
  };
}
