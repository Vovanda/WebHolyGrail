import { describe, expect, it } from 'vitest';

import { isStream } from './stream-source';

describe('isStream', () => {
  it('узнаёт манифест в хранилище', () => {
    expect(isStream('https://cdn.example/u1/hls/abc/master.m3u8')).toBe(true);
    expect(isStream('https://cdn.example/u1/hls/abc/master.m3u8?v=12')).toBe(true);
  });

  it('узнаёт дверь сайта, за которой лежит манифест', () => {
    expect(isStream('/internal/video/manifest/6')).toBe(true);
    expect(isStream('/internal/video/manifest/6/480p/index.m3u8')).toBe(true);
  });

  it('отдельный файл нарезкой не считает', () => {
    expect(isStream('https://cdn.example/sambulov.mp4')).toBe(false);
    expect(isStream('https://cdn.example/video.webm?v=3')).toBe(false);
  });
});
