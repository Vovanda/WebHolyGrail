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

  // Сетка прямоугольная: ряды разной длины оставили бы дырки по краю.
  const width = rows[0]?.length ?? 0;
  if (rows.some((row) => row.length !== width)) return null;

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
  return [...seen.keys()]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => {
      const box = seen.get(name) as { top: number; left: number; bottom: number; right: number };
      return {
        name,
        column: box.left + 1,
        row: box.top + 1,
        width: box.right - box.left + 1,
        height: box.bottom - box.top + 1,
      };
    });
}

/** Сколько колонок в записанной сетке. */
export function areasWidth(raw: string | null | undefined): number | null {
  const first = raw
    ?.split(':')[0]
    ?.trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (!first || first.length === 0) return null;

  return expand(first).length;
}
