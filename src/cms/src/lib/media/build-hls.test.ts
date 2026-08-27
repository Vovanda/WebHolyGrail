import { describe, expect, it, vi } from 'vitest';

import { ladderFromQualities } from './adapters.js';
import { buildHls } from './build-hls.js';
import type { RenditionResult, VideoPorts, VideoRecord } from './ports.js';

/**
 * Зеркало spec/video/access-invariants.smt2 в части подготовки видео.
 *
 * @remarks
 * Проверяется порядок действий, а не работа ffmpeg: сбой, при котором оригинал
 * удаляется раньше готовой раздачи, не проявляется падением — видео просто
 * пропадает, и восстановить его уже нечем.
 */

const SOURCE_URL = 'https://cdn.example/media/clip.mp4';

/** Порты-заглушки: пишут в журнал, чтобы был виден порядок вызовов. */
function makePorts(
  overrides: {
    previousPrefix?: string | null;
    mimeType?: string;
    hasPoster?: boolean;
    ownerId?: string | number | null;
  } = {},
) {
  const calls: string[] = [];
  const saved: RenditionResult[] = [];

  const record: VideoRecord = {
    id: 1,
    mimeType: overrides.mimeType ?? 'video/mp4',
    filename: 'clip.mp4',
    url: SOURCE_URL,
    previousPrefix: overrides.previousPrefix ?? null,
    hasPoster: overrides.hasPoster ?? false,
    // Именно проверка на undefined: `??` подменил бы осознанный null.
    ownerId: overrides.ownerId === undefined ? 7 : overrides.ownerId,
  };

  const ports: VideoPorts = {
    encoder: {
      transcode: vi.fn(async () => {
        calls.push('transcode');
        return {
          files: [
            {
              path: 'master.m3u8',
              body: Buffer.from('#EXTM3U'),
              contentType: 'application/vnd.apple.mpegurl',
            },
            { path: '480p/seg_00001.ts', body: Buffer.from('x'), contentType: 'video/mp2t' },
          ],
          rungs: [{ height: 480, videoKbps: 1200, audioKbps: 96 }],
          durationSeconds: 42,
          secret: Buffer.from('0123456789abcdef'),
          poster: Buffer.from('кадр'),
          storyboard: null,
        };
      }),
    },
    storage: {
      readSource: vi.fn(async () => {
        calls.push('readSource');
        return Buffer.from('исходник');
      }),
      put: vi.fn(async (key: string) => {
        calls.push(`put:${key.split('/').pop()}`);
      }),
      removeFolder: vi.fn(async (prefix: string) => {
        calls.push(`removeFolder:${prefix}`);
      }),
      remove: vi.fn(async (key: string) => {
        calls.push(`remove:${key}`);
      }),
      keyFromUrl: (url: string) => url.replace('https://cdn.example/', ''),
      urlForKey: (key: string) => `https://cdn.example/${key}`,
    },
    catalog: {
      read: vi.fn(async () => {
        calls.push('read');
        return record;
      }),
      saveRendition: vi.fn(async (_id, result: RenditionResult) => {
        calls.push('saveRendition');
        saved.push(result);
      }),
      ladder: vi.fn(async () => [{ height: 480, videoKbps: 1200, audioKbps: 96 }]),
      saveProgress: vi.fn(async () => undefined),
      savePoster: vi.fn(async () => {
        calls.push('savePoster');
      }),
    },
  };

  return { ports, calls, saved };
}

const run = (ports: VideoPorts) =>
  buildHls({ ports, mediaId: 1, keyUri: 'https://site.example/api/video/1/envelope' });

describe('подготовка видео', () => {
  it('оригинал удаляется после того, как вся раздача залита', async () => {
    const { ports, calls } = makePorts();
    await run(ports);

    const lastPut = calls.lastIndexOf(calls.filter((c) => c.startsWith('put:')).at(-1)!);
    const removeSource = calls.indexOf('remove:media/clip.mp4');
    expect(removeSource).toBeGreaterThan(lastPut);
  });

  it('сбой нарезки не уносит исходник', async () => {
    const { ports, calls } = makePorts();
    ports.encoder.transcode = vi.fn(async () => {
      throw new Error('ffmpeg упал');
    });

    await expect(run(ports)).rejects.toThrow('ffmpeg упал');
    expect(calls.some((c) => c.startsWith('remove:'))).toBe(false);
  });

  it('сбой заливки не уносит исходник', async () => {
    const { ports, calls } = makePorts();
    ports.storage.put = vi.fn(async () => {
      throw new Error('хранилище недоступно');
    });

    await expect(run(ports)).rejects.toThrow('хранилище недоступно');
    expect(calls.some((c) => c.startsWith('remove:'))).toBe(false);
  });

  it('повтор после ошибки стирает прошлую нарезку', async () => {
    const { ports, calls } = makePorts({ previousPrefix: 'hls/старый-адрес' });
    await run(ports);
    expect(calls).toContain('removeFolder:hls/старый-адрес');
  });

  it('первая нарезка ничего не стирает', async () => {
    const { ports, calls } = makePorts({ previousPrefix: null });
    await run(ports);
    expect(calls.some((c) => c.startsWith('removeFolder:'))).toBe(false);
  });

  it('адрес раздачи не выводится из номера медиафайла', async () => {
    const { ports, saved } = makePorts();
    await run(ports);
    expect(saved[0]!.prefix).toMatch(/^u7\/hls\/[0-9a-f-]{36}$/);
    expect(saved[0]!.prefix).not.toContain('/1/');
  });

  it('две нарезки одного ролика получают разные адреса', async () => {
    const first = makePorts();
    const second = makePorts();
    await run(first.ports);
    await run(second.ports);
    expect(first.saved[0]!.prefix).not.toBe(second.saved[0]!.prefix);
  });

  it('файлы разных авторов лежат в разных областях', async () => {
    const first = makePorts({ ownerId: 7 });
    const second = makePorts({ ownerId: 9 });
    await run(first.ports);
    await run(second.ports);
    expect(first.saved[0]!.prefix.startsWith('u7/')).toBe(true);
    expect(second.saved[0]!.prefix.startsWith('u9/')).toBe(true);
  });

  it('файл без автора уходит в общую область', async () => {
    const { ports, saved } = makePorts({ ownerId: null });
    await run(ports);
    expect(saved[0]!.prefix.startsWith('shared/')).toBe(true);
  });

  it('секрет уходит в каталог, а не в раздачу', async () => {
    const { ports, saved } = makePorts();
    await run(ports);

    expect(saved[0]!.secret).toBe(Buffer.from('0123456789abcdef').toString('base64'));
    const uploaded = (ports.storage.put as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    const bodies = uploaded.map((call) => String((call[1] as { body: Buffer }).body));
    expect(bodies.some((body) => body.includes('0123456789abcdef'))).toBe(false);
  });

  it('обложка снимается сама, когда своей нет', async () => {
    const { ports, calls } = makePorts({ hasPoster: false });
    await run(ports);
    expect(calls).toContain('savePoster');
  });

  it('заданная редактором обложка не перетирается', async () => {
    const { ports, calls } = makePorts({ hasPoster: true });
    await run(ports);
    expect(calls).not.toContain('savePoster');
  });

  it('не видео до кодирования не доходит', async () => {
    const { ports, calls } = makePorts({ mimeType: 'application/pdf' });
    await expect(run(ports)).rejects.toThrow('не видео');
    expect(calls).not.toContain('transcode');
  });
});

describe('лесенка из настроек', () => {
  it('пустой выбор даёт лесенку по умолчанию', () => {
    expect(ladderFromQualities(null).map((r) => r.height)).toEqual([480, 720]);
    expect(ladderFromQualities([]).map((r) => r.height)).toEqual([480, 720]);
  });

  it('ступени выстраиваются снизу вверх независимо от порядка выбора', () => {
    expect(ladderFromQualities(['1080', '360', '720']).map((r) => r.height)).toEqual([
      360, 720, 1080,
    ]);
  });

  it('неизвестное значение не ломает набор', () => {
    expect(ladderFromQualities(['720', '4320']).map((r) => r.height)).toEqual([720]);
  });

  it('если всё выбранное неизвестно, остаётся набор по умолчанию', () => {
    expect(ladderFromQualities(['4320']).map((r) => r.height)).toEqual([480, 720]);
  });
});
