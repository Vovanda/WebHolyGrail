import { describe, expect, it } from 'vitest';

import { copiesOf, copyRole, totalBytes, withoutCopy, type MediaRecord } from './media-copies';

const photo: MediaRecord = {
  filename: 'shot.webp',
  url: '/media/shot.webp',
  filesize: 900_000,
  width: 3000,
  height: 2000,
  mimeType: 'image/webp',
  sizes: {
    thumbnail: {
      filename: 'shot-400.webp',
      url: '/media/shot-400.webp',
      width: 400,
      height: 267,
      filesize: 30_000,
      mimeType: 'image/webp',
    },
    card: {
      filename: 'shot-768.webp',
      url: '/media/shot-768.webp',
      width: 768,
      height: 512,
      filesize: 80_000,
      mimeType: 'image/webp',
    },
    hero: { filename: null, url: null, width: null, height: null, filesize: null, mimeType: null },
  },
};

describe('копии файла', () => {
  it('идут от мелкой к крупной, оригинал последним', () => {
    expect(copiesOf(photo).map((c) => c.step)).toEqual(['thumbnail', 'card', '']);
    expect(copiesOf(photo).at(-1)?.original).toBe(true);
  });

  it('пустые ступени не считаются копиями - файла за ними нет', () => {
    expect(copiesOf(photo).some((c) => c.step === 'hero')).toBe(false);
  });

  it('у копии известен и размер, и вес - размер человеку понятнее ширины', () => {
    const smallest = copiesOf(photo)[0];
    expect(smallest).toMatchObject({ width: 400, height: 267, bytes: 30_000 });
  });

  it('у копии известен и размер, и вес - размер человеку понятнее ширины', () => {
    expect(copiesOf(photo)[0]).toMatchObject({ width: 400, height: 267, bytes: 30_000 });
  });

  it('вес складывается по всем копиям', () => {
    expect(totalBytes(photo)).toBe(1_010_000);
  });

  it('ступень убирается из перечня, остальное не трогается', () => {
    const got = withoutCopy(photo, 'thumbnail');
    expect(got).toMatchObject({ ok: true, drop: 'shot-400.webp' });
    if (!got.ok) return;
    expect(got.patch['sizes']).toEqual({ thumbnail: expect.objectContaining({ filename: null }) });
    expect(got.patch['filename']).toBeUndefined();
    expect(got.patch['originalDropped']).toBeUndefined();
  });

  it('вместо убранного оригинала файлом становится самая крупная ступень', () => {
    const got = withoutCopy(photo, '');
    expect(got).toMatchObject({ ok: true, drop: 'shot.webp' });
    if (!got.ok) return;
    expect(got.patch).toMatchObject({
      filename: 'shot-768.webp',
      url: '/media/shot-768.webp',
      filesize: 80_000,
      width: 768,
      height: 512,
      originalDropped: true,
    });
    expect(got.patch['sizes']).toEqual({ card: expect.objectContaining({ filename: null }) });
  });

  it('последнюю копию убрать нельзя - запись осталась бы без файла', () => {
    const single: MediaRecord = {
      filename: 'only.pdf',
      url: '/media/only.pdf',
      filesize: 100,
      sizes: {},
    };
    expect(withoutCopy(single, '')).toEqual({ ok: false, why: 'Это единственная копия файла' });
  });

  it('пока оригинал на месте, файл записи и есть исходник', () => {
    expect(copiesOf(photo).at(-1)).toMatchObject({ original: true, source: true });
  });

  it('после удаления оригинала файл записи исходником не считается', () => {
    const dropped = { ...photo, originalDropped: true };
    expect(copiesOf(dropped).at(-1)).toMatchObject({ original: true, source: false });
  });

  it('несуществующая копия отклоняется', () => {
    expect(withoutCopy(photo, 'wide')).toMatchObject({ ok: false });
  });
});

describe('роль строки копии', () => {
  it('исходник назван оригиналом, и кнопка это говорит', () => {
    expect(copyRole({ step: '', source: true, original: true })).toEqual({
      name: 'Оригинал',
      removeLabel: 'Удалить оригинал',
    });
  });

  it('копия на месте убранного исходника - самая крупная, удаляется файл записи', () => {
    expect(copyRole({ step: 'wide', source: false, original: true })).toEqual({
      name: 'Самая крупная копия',
      removeLabel: 'Удалить файл',
    });
  });

  it('обычная ступень - копия', () => {
    expect(copyRole({ step: 'card', source: false, original: false })).toEqual({
      name: 'card',
      removeLabel: 'Удалить копию',
    });
  });
});
