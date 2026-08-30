import { describe, expect, it } from 'vitest';

import { rewriteManifest } from './manifest';

/**
 * Манифест отдаётся со своего домена, поэтому ссылки внутри должны вести
 * либо в раздачу (сегменты), либо в свою дверь (вложенные манифесты).
 * Строка ключа - не ссылка на файл, её пишет нарезка и трогать её здесь нельзя.
 */

const opts = {
  folder: 'https://cdn.example/media/u1/hls/abc/480p',
  own: '/internal/video/manifest/87/480p',
};

describe('манифест со своего домена', () => {
  it('сегменты уводит в раздачу', () => {
    // Мегабайты через сайт идти не должны.
    const out = rewriteManifest('#EXTINF:4.0,\nseg_00000.ts\n', opts);
    expect(out).toContain('https://cdn.example/media/u1/hls/abc/480p/seg_00000.ts');
  });

  it('вложенные манифесты оставляет за собой', () => {
    // Уйдёт плеер за ними в раздачу - и ключ снова станет разрешаться оттуда.
    const out = rewriteManifest('#EXT-X-STREAM-INF:BANDWIDTH=1\n480p/index.m3u8\n', {
      folder: 'https://cdn.example/media/u1/hls/abc',
      own: '/internal/video/manifest/87',
    });
    expect(out).toContain('/internal/video/manifest/87/480p/index.m3u8');
  });

  it('строку ключа не трогает', () => {
    // Форму адреса знает нарезка. Приводить её здесь - завести второе место,
    // которое разойдётся с первым и уведёт ключ в никуда.
    const line = '#EXT-X-KEY:METHOD=AES-128,URI="/internal/video/key/87?p=1",IV=0x2';
    expect(rewriteManifest(line, opts)).toBe(line);
  });

  it('настройки и пустые строки оставляет как есть', () => {
    const text = '#EXTM3U\n#EXT-X-VERSION:3\n\n#EXT-X-ENDLIST';
    expect(rewriteManifest(text, opts)).toBe(text);
  });

  it('уже абсолютную ссылку на файл не переписывает', () => {
    const text = 'https://other.example/seg_00000.ts';
    expect(rewriteManifest(text, opts)).toBe(text);
  });
});
