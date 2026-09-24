import { describe, expect, it } from 'vitest';

import { playlistCovers } from './playlist-covers.js';

/**
 * Стопкой кадров плейлист показывается там, где своей обложки нет. Ошибка
 * здесь либо оставляет пустое место, либо тянет лишние адреса в каждый ответ.
 */

/** Строка плейлиста в том виде, в каком её отдаёт база: кадр внутри видео. */
const frame = (url: string | null) => ({ video: { preview: url === null ? null : { url } } });

describe('кадры для стопки', () => {
  it('отдаются документами, а не адресами: по документу показ выберет ступень', () => {
    const [first] = playlistCovers([frame('/a.jpg')]);
    expect(first).toMatchObject({ url: '/a.jpg' });
  });

  it('берутся по порядку плейлиста', () => {
    expect(playlistCovers([frame('/a.jpg'), frame('/b.jpg')])).toEqual([
      { url: '/a.jpg' },
      { url: '/b.jpg' },
    ]);
  });

  it('не больше трёх: в стопке остальные не видны', () => {
    const many = ['/a', '/b', '/c', '/d', '/e'].map(frame);
    expect(playlistCovers(many)).toEqual([{ url: '/a' }, { url: '/b' }, { url: '/c' }]);
  });

  it('видео без кадра пропускается', () => {
    expect(playlistCovers([frame(null), frame('/b.jpg'), {}])).toEqual([{ url: '/b.jpg' }]);
  });

  it('нераскрытая связь пропускается: вместо видео пришёл его номер', () => {
    expect(playlistCovers([{ video: 42 }, frame('/b.jpg')])).toEqual([{ url: '/b.jpg' }]);
  });

  it('повторы не задваиваются', () => {
    expect(playlistCovers([frame('/a.jpg'), frame('/a.jpg'), frame('/b.jpg')])).toEqual([
      { url: '/a.jpg' },
      { url: '/b.jpg' },
    ]);
  });

  it('пустой плейлист даёт пусто, а не падает', () => {
    expect(playlistCovers([])).toEqual([]);
  });
});
