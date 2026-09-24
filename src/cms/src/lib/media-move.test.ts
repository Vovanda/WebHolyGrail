import { describe, expect, it } from 'vitest';

import { movePlan, storageKey } from './media-move';
import type { MediaRecord } from './media-copies';

const url = (key: string) => `https://cdn.site.ru/${key}`;

const photo: MediaRecord = {
  prefix: '',
  filename: 'shot.webp',
  url: 'https://cdn.site.ru/shot.webp',
  filesize: 900_000,
  mimeType: 'image/jpeg',
  width: 3000,
  height: 2000,
  sizes: {
    card: {
      filename: 'shot-768.webp',
      url: 'https://cdn.site.ru/shot-768.webp',
      width: 768,
      height: 512,
      filesize: 80_000,
      mimeType: 'image/webp',
    },
  },
};

describe('ключ в хранилище', () => {
  it('в корне - это само имя файла', () => {
    expect(storageKey('', 'shot.webp')).toBe('shot.webp');
    expect(storageKey(null, 'shot.webp')).toBe('shot.webp');
  });

  it('в папке - папка и имя через косую', () => {
    expect(storageKey('photos', 'shot.webp')).toBe('photos/shot.webp');
  });

  it('лишние косые по краям папки не создают пустых уровней', () => {
    expect(storageKey('/photos/', 'shot.webp')).toBe('photos/shot.webp');
  });
});

describe('перенос в другую папку', () => {
  it('переезжают все копии разом, иначе запись ведёт в два места', () => {
    const { moves } = movePlan({ doc: photo, to: 'photos', urlForKey: url });
    expect(moves).toEqual([
      {
        filename: 'shot-768.webp',
        from: 'shot-768.webp',
        to: 'photos/shot-768.webp',
        contentType: 'image/webp',
      },
      {
        filename: 'shot.webp',
        from: 'shot.webp',
        to: 'photos/shot.webp',
        contentType: 'image/jpeg',
      },
    ]);
  });

  it('адреса в записи обновляются под новое место', () => {
    const { patch } = movePlan({ doc: photo, to: 'photos', urlForKey: url });
    expect(patch).toMatchObject({
      prefix: 'photos',
      url: 'https://cdn.site.ru/photos/shot.webp',
      sizes: { card: { url: 'https://cdn.site.ru/photos/shot-768.webp' } },
    });
  });

  it('ступень уходит в правку целиком: без типа проверка Payload отвечает Invalid file type', () => {
    const { patch } = movePlan({ doc: photo, to: 'photos', urlForKey: url });
    expect(patch['sizes']).toEqual({
      card: {
        filename: 'shot-768.webp',
        url: 'https://cdn.site.ru/photos/shot-768.webp',
        width: 768,
        height: 512,
        filesize: 80_000,
        mimeType: 'image/webp',
      },
    });
  });

  it('возврат в корень - такой же обычный переезд', () => {
    const inFolder = { ...photo, prefix: 'photos' };
    const { moves, patch } = movePlan({ doc: inFolder, to: '', urlForKey: url });
    expect(moves[0]).toMatchObject({ from: 'photos/shot-768.webp', to: 'shot-768.webp' });
    expect(patch).toMatchObject({ prefix: '', url: 'https://cdn.site.ru/shot.webp' });
  });

  it('та же папка переездом не считается - трогать хранилище незачем', () => {
    const inFolder = { ...photo, prefix: 'photos' };
    expect(movePlan({ doc: inFolder, to: 'photos', urlForKey: url })).toEqual({
      moves: [],
      patch: {},
    });
    expect(movePlan({ doc: inFolder, to: '/photos/', urlForKey: url })).toEqual({
      moves: [],
      patch: {},
    });
  });

  it('у нарезанного видео файлы не переезжают: имя в записи подменено на мастер пакета', () => {
    const video = {
      prefix: '',
      filename: 'u1/hls/abc/master.m3u8',
      url: '/internal/video/manifest/13',
      mimeType: 'video/mp4',
      sizes: {},
      hls: { prefix: 'u1/hls/abc' },
    };
    expect(movePlan({ doc: video, to: 'objects', urlForKey: url })).toEqual({
      moves: [],
      patch: {},
    });
  });

  it('файл без копий переезжает один', () => {
    const document: MediaRecord = {
      prefix: '',
      filename: 'act.pdf',
      url: 'https://cdn.site.ru/act.pdf',
      sizes: {},
    };
    const { moves } = movePlan({ doc: document, to: 'docs', urlForKey: url });
    expect(moves).toEqual([
      {
        filename: 'act.pdf',
        from: 'act.pdf',
        to: 'docs/act.pdf',
        contentType: 'application/octet-stream',
      },
    ]);
  });
});
