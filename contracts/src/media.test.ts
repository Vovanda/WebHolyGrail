import { describe, expect, it } from 'vitest';

import { fileKindOf, frameAspectOf } from './media';

describe('форма одиночного кадра', () => {
  it('лежачий снимок идёт 16:9', () => {
    expect(frameAspectOf({ width: 4000, height: 3000 })).toEqual({ width: 16, height: 9 });
  });

  it('стоячий снимок идёт 9:16', () => {
    expect(frameAspectOf({ width: 1080, height: 1920 })).toEqual({ width: 9, height: 16 });
  });

  it('квадрат идёт лёжа', () => {
    expect(frameAspectOf({ width: 1000, height: 1000 })).toEqual({ width: 16, height: 9 });
  });

  it('без размеров формы нет', () => {
    expect(frameAspectOf({ width: 1000 })).toBeUndefined();
    expect(frameAspectOf(null)).toBeUndefined();
  });
});

describe('тип файла словом', () => {
  it('частые типы названы по-русски', () => {
    expect(fileKindOf('application/pdf')).toBe('PDF');
    expect(fileKindOf('image/webp')).toBe('изображение');
    expect(fileKindOf('video/mp4')).toBe('видео');
  });

  it('прочее - по второй части типа, пустое - «файл»', () => {
    expect(fileKindOf('application/zip')).toBe('zip');
    expect(fileKindOf(undefined)).toBe('файл');
  });
});
