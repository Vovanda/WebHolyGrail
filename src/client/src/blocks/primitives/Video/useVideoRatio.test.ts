import { describe, expect, it } from 'vitest';

import { ratioOf, fullscreenOrientationOf } from './useVideoRatio';

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

describe('fullscreenOrientationOf', () => {
  it('вертикальную запись разворачивает стоя', () => {
    expect(fullscreenOrientationOf('1080/1920')).toBe('portrait');
  });

  it('горизонтальную оставляет лежащей', () => {
    expect(fullscreenOrientationOf('1920/1080')).toBe('landscape');
  });

  it('квадратную считает горизонтальной: поворачивать её незачем', () => {
    expect(fullscreenOrientationOf('1000/1000')).toBe('landscape');
  });

  it('без формы записи держится горизонтали - как и рамка до метаданных', () => {
    expect(fullscreenOrientationOf(null)).toBe('landscape');
    expect(fullscreenOrientationOf('0/0')).toBe('landscape');
    expect(fullscreenOrientationOf('чепуха')).toBe('landscape');
  });
});
