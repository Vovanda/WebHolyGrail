import { describe, expect, it } from 'vitest';

import { laneNextPage, laneRing } from './shop';

const ids = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i }));

describe('laneRing', () => {
  it('начало и хвост без середины - хвост замыкает кольцо', () => {
    expect(laneRing(ids(1, 3), [], ids(9, 10)).map((i) => i.id)).toEqual([1, 2, 3, 9, 10]);
  });

  it('страница перекрывает начало и хвост - без повторов, хвост последним', () => {
    const ring = laneRing(ids(1, 3), [ids(1, 10)], ids(9, 10));
    expect(ring.map((i) => i.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('laneNextPage', () => {
  it('раздел целиком в начале и хвосте - догружать нечего', () => {
    expect(laneNextPage(16, 12, 4, 0, 30)).toBeNull();
  });

  it('середина на первой странице - одна страница', () => {
    expect(laneNextPage(25, 12, 4, 0, 30)).toBe(1);
    expect(laneNextPage(25, 12, 4, 1, 30)).toBeNull();
  });

  it('длинный раздел - страницы до той, где начинается хвост', () => {
    expect(laneNextPage(100, 12, 4, 3, 30)).toBe(4);
    expect(laneNextPage(100, 12, 4, 4, 30)).toBeNull();
  });
});
