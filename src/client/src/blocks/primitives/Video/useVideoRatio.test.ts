import { describe, expect, it } from 'vitest';

import { ratioOf } from './useVideoRatio';

/**
 * Ошибка здесь видна сразу: запись растягивается поперёк себя или страница
 * прыгает, когда кадр наконец приходит.
 */

describe('форма кадра', () => {
  it('берётся у самой записи', () => {
    expect(ratioOf(854, 480)).toBe('854/480');
    // Вертикальная запись: рамка идёт за ней, а не наоборот.
    expect(ratioOf(1080, 1920)).toBe('1080/1920');
  });

  it('до метаданных её нет', () => {
    expect(ratioOf(0, 0)).toBeNull();
    expect(ratioOf(854, 0)).toBeNull();
  });

  it('не выдумывается из мусора', () => {
    expect(ratioOf(Number.NaN, 480)).toBeNull();
    expect(ratioOf(-854, 480)).toBeNull();
    expect(ratioOf(Number.POSITIVE_INFINITY, 480)).toBeNull();
  });
});
