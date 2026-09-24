import { describe, expect, it } from 'vitest';

import { withCacheBust, withManifestRoute, withStreamAddress } from './media-read';

const READY = {
  status: 'ready',
  playlistUrl: 'https://cdn.example/hls/abc/master.m3u8',
  prefix: 'hls/abc',
  packBytes: 12_000,
};

describe('адрес манифеста', () => {
  it('нарезанное видео отдаёт манифест через зеркальную ручку', () => {
    const got = withManifestRoute({ id: 7, hls: READY });
    expect(got['hls']).toMatchObject({
      playlistUrl: '/internal/video/manifest/7',
      prefix: 'hls/abc',
    });
  });

  it('без папки нарезки запись не трогается', () => {
    const doc = { id: 7, hls: { playlistUrl: 'x.m3u8' } };
    expect(withManifestRoute(doc)).toBe(doc);
  });
});

describe('пакет нарезки вместо исходника', () => {
  it('адрес, имя и вес становятся пакетом, вес исходника уезжает рядом', () => {
    const got = withStreamAddress({ url: '/media/lesson.mp4', filesize: 900_000, hls: READY });
    expect(got).toMatchObject({
      url: READY.playlistUrl,
      filename: 'hls/abc/master.m3u8',
      filesize: 12_000,
      sourceFilesize: 900_000,
    });
  });

  it('недорезанное видео остаётся исходником', () => {
    const doc = { url: '/media/lesson.mp4', hls: { ...READY, status: 'processing' } };
    expect(withStreamAddress(doc)).toBe(doc);
  });

  it('миниатюра берётся из развёрнутой связи раньше поля рядом', () => {
    const got = withStreamAddress({ preview: { url: '/new.webp' }, previewUrl: '/old.webp' });
    expect(got['thumbnailURL']).toBe('/new.webp');
  });

  it('в списке связь приходит номером - миниатюру даёт поле рядом', () => {
    const got = withStreamAddress({ preview: 12, previewUrl: '/frame.webp' });
    expect(got['thumbnailURL']).toBe('/frame.webp');
  });

  it('без веса пакета подпись веса не меняется', () => {
    const got = withStreamAddress({ filesize: 900, hls: { ...READY, packBytes: null } });
    expect(got['filesize']).toBe(900);
    expect(got).not.toHaveProperty('sourceFilesize');
  });
});

describe('метка версии в адресе', () => {
  const updatedAt = '2026-09-24T10:00:00.000Z';
  const stamp = new Date(updatedAt).getTime();

  it('метка стоит у файла и у каждой ступени', () => {
    const got = withCacheBust({
      url: '/media/a.webp',
      updatedAt,
      sizes: { card: { url: '/media/a-768.webp' }, hero: { url: null } },
    });
    expect(got['url']).toBe(`/media/a.webp?v=${stamp}`);
    expect(got['sizes']).toEqual({
      card: { url: `/media/a-768.webp?v=${stamp}` },
      hero: { url: null },
    });
  });

  it('к адресу со строкой запроса метка дописывается через амперсанд', () => {
    const got = withCacheBust({ url: '/media/a.webp?x=1', updatedAt });
    expect(got['url']).toBe(`/media/a.webp?x=1&v=${stamp}`);
  });

  it('без даты правки метка берётся от текущего времени', () => {
    expect(withCacheBust({ url: '/a.webp' }, () => 42)['url']).toBe('/a.webp?v=42');
  });

  it('запись без адреса не трогается', () => {
    const doc = { filename: 'a.webp' };
    expect(withCacheBust(doc)).toBe(doc);
  });
});
