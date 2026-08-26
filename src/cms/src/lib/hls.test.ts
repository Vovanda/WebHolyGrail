import { describe, expect, it } from 'vitest';

import { DEFAULT_LADDER, selectRungs, type HlsRung } from './hls.js';

/**
 * Выбор ступеней проверяется отдельно от кодирования: сам ffmpeg тут не нужен,
 * а ошибка в отборе тихая — ролик просто окажется без нужного качества или,
 * наоборот, с растянутым из мелкого исходника.
 */

const ladder: ReadonlyArray<HlsRung> = [
  { height: 480, videoKbps: 1200, audioKbps: 96 },
  { height: 720, videoKbps: 2800, audioKbps: 128 },
  { height: 1080, videoKbps: 5000, audioKbps: 128 },
];

describe('selectRungs', () => {
  it('для большого исходника собирает всю лесенку', () => {
    expect(selectRungs(ladder, 2160).map((r) => r.height)).toEqual([480, 720, 1080]);
  });

  it('не создаёт ступени выше исходника', () => {
    expect(selectRungs(ladder, 720).map((r) => r.height)).toEqual([480, 720]);
  });

  it('нестандартная высота не отрезает своё качество', () => {
    // 1088 вместо 1080 встречается у записи с телефона: без допуска HD-ролик
    // остался бы без HD-ступени.
    expect(selectRungs(ladder, 1088).map((r) => r.height)).toContain(1080);
  });

  it('мелкий исходник всё равно получает одну дорожку', () => {
    // Без единой ступени плееру нечего играть — отдаём нижнюю.
    expect(selectRungs(ladder, 240).map((r) => r.height)).toEqual([480]);
  });

  it('без данных о высоте берёт лесенку целиком', () => {
    // ffprobe мог не прочитать поток: лучше собрать всё, чем не собрать ничего.
    expect(selectRungs(ladder, null).map((r) => r.height)).toEqual([480, 720, 1080]);
  });

  it('лесенка по умолчанию — 480p и HD, снизу вверх', () => {
    expect(DEFAULT_LADDER.map((r) => r.height)).toEqual([480, 720]);
  });
});
