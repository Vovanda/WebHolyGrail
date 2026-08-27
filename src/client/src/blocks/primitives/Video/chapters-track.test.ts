import { describe, expect, it } from 'vitest';

import { chaptersTrackUrl } from './chapters-track';

/**
 * Оглавление собирается в браузере из строк, которые владелец завёл в админке.
 * Проверяем разметку дорожки: плеер читает её буквально.
 */

function decode(url: string | null): string {
  return url ? decodeURIComponent(url.replace('data:text/vtt;charset=utf-8,', '')) : '';
}

describe('chaptersTrackUrl', () => {
  it('без глав дорожки нет', () => {
    expect(chaptersTrackUrl([], 600)).toBeNull();
  });

  it('главы идут подряд: каждая тянется до следующей', () => {
    const text = decode(
      chaptersTrackUrl(
        [
          { startSeconds: 0, title: 'Начало' },
          { startSeconds: 125, title: 'Разбор' },
        ],
        300,
      ),
    );
    expect(text).toContain('WEBVTT');
    expect(text).toContain('00:00:00.000 --> 00:02:05.000');
    expect(text).toContain('Начало');
    expect(text).toContain('00:02:05.000 --> 00:05:00.000');
    expect(text).toContain('Разбор');
  });

  it('порядок в админке не важен: главы выстраиваются по времени', () => {
    const text = decode(
      chaptersTrackUrl(
        [
          { startSeconds: 60, title: 'Вторая' },
          { startSeconds: 0, title: 'Первая' },
        ],
        120,
      ),
    );
    expect(text.indexOf('Первая')).toBeLessThan(text.indexOf('Вторая'));
  });

  it('без известной длительности последняя глава всё равно попадает в дорожку', () => {
    const text = decode(chaptersTrackUrl([{ startSeconds: 10, title: 'Одна' }], null));
    expect(text).toContain('Одна');
    expect(text).toContain('00:00:10.000 -->');
  });

  it('глава позже конца записи в дорожку не идёт', () => {
    expect(chaptersTrackUrl([{ startSeconds: 400, title: 'Мимо' }], 300)).toBeNull();
  });
});
