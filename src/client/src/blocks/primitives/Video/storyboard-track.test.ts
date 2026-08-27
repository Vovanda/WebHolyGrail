import { describe, expect, it } from 'vitest';

import { storyboardTrackUrl } from './storyboard-track';

/**
 * Разметку кадров плеер читает буквально: неверные координаты дадут соседний
 * кадр или пустоту под курсором.
 */

function decode(url: string | null): string {
  return url ? decodeURIComponent(url.replace('data:text/vtt;charset=utf-8,', '')) : '';
}

const board = {
  url: 'https://cdn.example/u1/hls/abc/storyboard.jpg',
  columns: 3,
  rows: 2,
  count: 5,
  frameWidth: 160,
  frameHeight: 90,
  intervalSeconds: 4,
};

describe('storyboardTrackUrl', () => {
  it('без ленты подсказок нет', () => {
    expect(storyboardTrackUrl(null)).toBeNull();
    expect(storyboardTrackUrl({ ...board, count: 0 })).toBeNull();
  });

  it('каждый кадр получает свой отрезок времени', () => {
    const text = decode(storyboardTrackUrl(board));
    expect(text).toContain('00:00:00.000 --> 00:00:04.000');
    expect(text).toContain('00:00:16.000 --> 00:00:20.000');
  });

  it('координаты кадра считаются по сетке', () => {
    const text = decode(storyboardTrackUrl(board));
    // первый кадр - левый верхний угол
    expect(text).toContain('storyboard.jpg#xywh=0,0,160,90');
    // четвёртый - начало второго ряда
    expect(text).toContain('storyboard.jpg#xywh=0,90,160,90');
    // третий - конец первого ряда
    expect(text).toContain('storyboard.jpg#xywh=320,0,160,90');
  });

  it('кадров в разметке ровно столько, сколько сняли', () => {
    const text = decode(storyboardTrackUrl(board));
    expect(text.match(/#xywh=/g)).toHaveLength(5);
  });

  it('дробный промежуток не теряет миллисекунды', () => {
    const text = decode(storyboardTrackUrl({ ...board, intervalSeconds: 2.5, count: 2 }));
    expect(text).toContain('00:00:02.500 --> 00:00:05.000');
  });
});
