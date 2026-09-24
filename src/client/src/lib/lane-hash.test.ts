import { describe, expect, it } from 'vitest';

import { isLaneHash, laneHash, parseLaneHash } from './lane-hash';

describe('лента в адресе', () => {
  it('метка читается обратно в группу и номер', () => {
    expect(parseLaneHash(laneHash('dog-65923', 4))).toEqual({ group: 'dog-65923', index: 4 });
  });

  it('группа с пробелами и кириллицей переживает адрес', () => {
    const hash = laneHash('цитата Анна', 0);
    expect(hash).not.toContain(' ');
    expect(parseLaneHash(hash)).toEqual({ group: 'цитата Анна', index: 0 });
  });

  it('чужая решётка лентой не считается', () => {
    expect(parseLaneHash('#contacts')).toBeNull();
    expect(isLaneHash('#contacts')).toBe(false);
  });

  it('испорченная метка не открывает ленту', () => {
    expect(parseLaneHash('#lb=page/')).toBeNull();
    expect(parseLaneHash('#lb=%E0%A4%A/1')).toBeNull();
    expect(isLaneHash('#lb=page/')).toBe(true);
  });
});
