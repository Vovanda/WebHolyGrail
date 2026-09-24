import type { MediaDoc } from 'contracts';
import { describe, expect, it } from 'vitest';

import { galleryFrames, isRecording } from './gallery';

const photo = (id: number, extra: Partial<MediaDoc> = {}) =>
  ({ id: String(id), url: `/m/${id}.webp`, mimeType: 'image/webp', ...extra }) as MediaDoc;

describe('кадры галереи', () => {
  it('идут в порядке поля, подпись берётся у файла', () => {
    const frames = galleryFrames([photo(1, { caption: 'Узел примыкания' }), photo(2)]);
    expect(frames.map((f) => f.file.id)).toEqual(['1', '2']);
    expect(frames[0]?.caption).toBe('Узел примыкания');
    expect(frames[1]).not.toHaveProperty('caption');
  });

  it('нераскрытый номер и пустота пропускаются', () => {
    expect(galleryFrames(['7', null, undefined, photo(3)]).map((f) => f.file.id)).toEqual(['3']);
  });

  it('подпись из пробелов считается пустой', () => {
    expect(galleryFrames([photo(4, { caption: '   ' })])[0]).not.toHaveProperty('caption');
  });

  it('не список вместо списка даёт пустой набор, а не падение', () => {
    expect(galleryFrames(photo(9))).toEqual([]);
    expect(galleryFrames('12')).toEqual([]);
  });

  it('пустое поле даёт пустой набор', () => {
    expect(galleryFrames(undefined)).toEqual([]);
    expect(galleryFrames(null)).toEqual([]);
  });

  it('запись узнаётся по типу файла', () => {
    expect(isRecording({ file: photo(5, { mimeType: 'video/mp4' }) })).toBe(true);
    expect(isRecording({ file: photo(6) })).toBe(false);
  });
});
