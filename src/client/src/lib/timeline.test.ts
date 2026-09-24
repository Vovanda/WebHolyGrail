import { describe, expect, it } from 'vitest';

import { sortTimeline, type TimelineEntry } from './timeline';

const entry = (year: string, body: string): TimelineEntry => ({ year, body });
const bodies = (list: readonly TimelineEntry[]) => list.map((e) => e.body);

describe('порядок таймлайна', () => {
  const list = [entry('2019', 'a'), entry('с 2021', 'b'), entry('2019', 'c'), entry('', 'd')];

  it('по убыванию года, одинаковые годы - в порядке владельца', () => {
    expect(bodies(sortTimeline(list, 'year-desc'))).toEqual(['b', 'a', 'c', 'd']);
  });

  it('по возрастанию года', () => {
    expect(bodies(sortTimeline(list, 'year-asc'))).toEqual(['d', 'a', 'c', 'b']);
  });

  it('ручной порядок не трогается', () => {
    expect(bodies(sortTimeline(list, 'manual'))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('пустой и незаполненный год не роняют сортировку, строки не теряются', () => {
    const broken = [entry(undefined as unknown as string, 'x'), entry('2020', 'y')];
    expect(bodies(sortTimeline(broken, 'year-desc'))).toEqual(['y', 'x']);
  });
});
