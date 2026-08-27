import { describe, expect, it } from 'vitest';

import { playlistCovers } from './playlist-covers.js';

/**
 * Стопкой кадров плейлист показывается там, где своей обложки нет. Ошибка
 * здесь либо оставляет пустое место, либо тянет лишние адреса в каждый ответ.
 */

const кадр = (url: string | null) => ({ preview: url === null ? null : { url } });

describe('кадры для стопки', () => {
  it('берутся по порядку плейлиста', () => {
    expect(playlistCovers([кадр('/a.jpg'), кадр('/b.jpg')])).toEqual(['/a.jpg', '/b.jpg']);
  });

  it('не больше трёх: в стопке остальные не видны', () => {
    const много = ['/a', '/b', '/c', '/d', '/e'].map(кадр);
    expect(playlistCovers(много)).toEqual(['/a', '/b', '/c']);
  });

  it('видео без кадра пропускается', () => {
    expect(playlistCovers([кадр(null), кадр('/b.jpg'), {}])).toEqual(['/b.jpg']);
  });

  it('повторы не задваиваются', () => {
    expect(playlistCovers([кадр('/a.jpg'), кадр('/a.jpg'), кадр('/b.jpg')])).toEqual([
      '/a.jpg',
      '/b.jpg',
    ]);
  });

  it('пустой плейлист даёт пусто, а не падает', () => {
    expect(playlistCovers([])).toEqual([]);
  });
});
