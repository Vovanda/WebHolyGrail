/**
 * Порядок записей таймлайна.
 *
 * @remarks
 * Год - строка, которую владелец пишет как хочет: «2019», «с 2019», «2019-2021».
 * Для порядка берётся первое число в ней. Пустое поле не роняет страницу:
 * запись идёт с нулевым годом - владелец завёл строку и вернётся к ней позже.
 */
export interface TimelineEntry {
  readonly year: string;
  readonly icon?: string;
  readonly body: string;
}

export type TimelineSort = 'year-desc' | 'year-asc' | 'manual';

function yearOf(entry: TimelineEntry): number {
  const found = typeof entry.year === 'string' ? entry.year.match(/-?\d{2,4}/) : null;
  return found ? Number(found[0]) : 0;
}

/** Записи в выбранном порядке; при равных годах - в порядке, заданном владельцем. */
export function sortTimeline(
  entries: readonly TimelineEntry[],
  sort: TimelineSort,
): readonly TimelineEntry[] {
  if (sort === 'manual') return entries;
  const sign = sort === 'year-desc' ? -1 : 1;
  return entries
    .map((entry, at) => ({ entry, at, year: yearOf(entry) }))
    .sort((a, b) => sign * (a.year - b.year) || a.at - b.at)
    .map(({ entry }) => entry);
}
