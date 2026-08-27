import { describe, expect, it, vi } from 'vitest';

import type { StoragePort } from './ports.js';
import { purgeDeleted, type PurgeCandidate } from './purge.js';

/**
 * Уборка удалённых видео.
 *
 * @remarks
 * Ошибка здесь тихая в обе стороны: стёрли раньше срока — восстановить нечем,
 * не стёрли вовсе — бакет копит мусор, о котором никто не узнает.
 */

const NOW = new Date('2026-08-26T12:00:00Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

function makeStorage() {
  const removed: string[] = [];
  const storage = {
    removeFolder: vi.fn(async (prefix: string) => {
      removed.push(prefix);
    }),
  } as unknown as StoragePort;
  return { storage, removed };
}

const run = (candidates: ReadonlyArray<PurgeCandidate>, afterDays = 30) => {
  const { storage, removed } = makeStorage();
  const forgotten: Array<string | number> = [];
  return purgeDeleted({
    candidates,
    storage,
    afterDays,
    now: NOW,
    forget: async (id) => {
      forgotten.push(id);
    },
  }).then((summary) => ({ summary, removed, forgotten }));
};

describe('уборка удалённых', () => {
  it('стирает то, что помечено дольше срока', async () => {
    const { summary, removed, forgotten } = await run([
      { id: 1, deletedAt: daysAgo(31), prefix: 'u7/hls/abc' },
    ]);
    expect(removed).toEqual(['u7/hls/abc']);
    expect(forgotten).toEqual([1]);
    expect(summary.purged).toEqual([1]);
  });

  it('не трогает помеченное недавно', async () => {
    const { summary, removed, forgotten } = await run([
      { id: 2, deletedAt: daysAgo(3), prefix: 'u7/hls/def' },
    ]);
    expect(removed).toEqual([]);
    expect(forgotten).toEqual([]);
    expect(summary.waiting).toBe(1);
  });

  it('в день истечения срока ещё ждёт', async () => {
    // Ровно на границе оставляем файлы: сутки туда-сюда дешевле, чем стереть
    // то, что человек собирался вернуть.
    const { removed } = await run([{ id: 3, deletedAt: daysAgo(30), prefix: 'u7/hls/ghi' }]);
    expect(removed).toEqual([]);
  });

  it('срок берётся из настроек, а не зашит', async () => {
    const { removed } = await run([{ id: 4, deletedAt: daysAgo(8), prefix: 'u7/hls/jkl' }], 7);
    expect(removed).toEqual(['u7/hls/jkl']);
  });

  it('видео без нарезки просто забывается', async () => {
    const { removed, forgotten } = await run([{ id: 5, deletedAt: daysAgo(40), prefix: null }]);
    expect(removed).toEqual([]);
    expect(forgotten).toEqual([5]);
  });

  it('битая дата пометки ничего не стирает', async () => {
    const { removed, forgotten } = await run([
      { id: 6, deletedAt: 'не дата', prefix: 'u7/hls/mno' },
    ]);
    expect(removed).toEqual([]);
    expect(forgotten).toEqual([]);
  });

  it('запись убирается только после того, как файлы стёрты', async () => {
    const { storage } = makeStorage();
    const order: string[] = [];
    storage.removeFolder = vi.fn(async () => {
      order.push('removeFolder');
    });

    await purgeDeleted({
      candidates: [{ id: 7, deletedAt: daysAgo(60), prefix: 'u7/hls/pqr' }],
      storage,
      afterDays: 30,
      now: NOW,
      forget: async () => {
        order.push('forget');
      },
    });

    expect(order).toEqual(['removeFolder', 'forget']);
  });

  it('сбой стирания оставляет видео на следующий проход', async () => {
    const { storage } = makeStorage();
    storage.removeFolder = vi.fn(async () => {
      throw new Error('хранилище недоступно');
    });
    const forgotten: Array<string | number> = [];

    await expect(
      purgeDeleted({
        candidates: [{ id: 8, deletedAt: daysAgo(60), prefix: 'u7/hls/stu' }],
        storage,
        afterDays: 30,
        now: NOW,
        forget: async (id) => {
          forgotten.push(id);
        },
      }),
    ).rejects.toThrow('хранилище недоступно');

    expect(forgotten).toEqual([]);
  });
});
