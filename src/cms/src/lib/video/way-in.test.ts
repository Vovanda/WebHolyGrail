import { describe, expect, it } from 'vitest';

import { hasWayIn } from './way-in.js';

const NOW = new Date('2026-08-30T12:00:00.000Z');
const LATER = '2026-09-30T12:00:00.000Z';

/**
 * Хранилище-заглушка: отвечает заранее заданными списками по коллекциям.
 *
 * @remarks
 * Проверяем решение, а не запросы: подборки, доступы и коды задаются прямо,
 * поэтому видно, какой набор данных к какому ответу приводит.
 */
const store = (docs: {
  playlists?: ReadonlyArray<{ id: number }>;
  accesses?: ReadonlyArray<{ id: number }>;
  codes?: ReadonlyArray<Record<string, unknown>>;
}) =>
  ({
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'playlists') return { docs: docs.playlists ?? [] };
      if (collection === 'media-accesses') return { docs: docs.accesses ?? [] };
      return { docs: docs.codes ?? [] };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const video = { kind: 'media', id: 69 } as const;
const access = [{ id: 1 }];

describe('есть ли чем открыть закрытое', () => {
  it('запись не покрыта ни одним доступом - нечем', async () => {
    expect(await hasWayIn(store({}), video, NOW)).toBe(false);
  });

  it('доступ есть, а кодов от него нет - нечем', async () => {
    expect(await hasWayIn(store({ accesses: access, codes: [] }), video, NOW)).toBe(false);
  });

  it('живой код от покрывающего доступа - есть', async () => {
    const codes = [{ maxUses: null, usedCount: 0, expiresAt: LATER }];
    expect(await hasWayIn(store({ accesses: access, codes }), video, NOW)).toBe(true);
  });

  it('доступ через подборку, в которой лежит запись, тоже считается', async () => {
    const codes = [{ maxUses: 10, usedCount: 3, expiresAt: LATER }];
    expect(
      await hasWayIn(store({ playlists: [{ id: 5 }], accesses: access, codes }), video, NOW),
    ).toBe(true);
  });

  it('исчерпавший предел код не считается', async () => {
    const codes = [{ maxUses: 5, usedCount: 5, expiresAt: LATER }];
    expect(await hasWayIn(store({ accesses: access, codes }), video, NOW)).toBe(false);
  });
});
