import { describe, expect, it } from 'vitest';

import { hasWayIn } from './way-in.js';

const NOW = new Date('2026-08-30T12:00:00.000Z');
const LATER = '2026-09-30T12:00:00.000Z';
const EARLIER = '2026-08-01T12:00:00.000Z';

/**
 * Хранилище-заглушка: отвечает заранее заданными списками по коллекциям.
 *
 * @remarks
 * Проверяем решение, а не запросы: подборки, коды и ссылки задаются прямо,
 * поэтому видно, какой набор данных к какому ответу приводит.
 */
const store = (docs: {
  playlists?: ReadonlyArray<{ id: number }>;
  codes?: ReadonlyArray<Record<string, unknown>>;
  links?: ReadonlyArray<Record<string, unknown>>;
}) =>
  ({
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'playlists') return { docs: docs.playlists ?? [] };
      if (collection === 'access-codes') return { docs: docs.codes ?? [] };
      return { docs: docs.links ?? [] };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const video = { kind: 'media', id: 69 } as const;

describe('есть ли чем открыть закрытое', () => {
  it('без кодов и ссылок - нечем', async () => {
    expect(await hasWayIn(store({}), video, NOW)).toBe(false);
  });

  it('живой код на саму запись - есть', async () => {
    const codes = [{ maxUses: null, usedCount: 0, expiresAt: LATER }];
    expect(await hasWayIn(store({ codes }), video, NOW)).toBe(true);
  });

  it('код на подборку, в которой лежит запись, тоже открывает', async () => {
    const codes = [{ maxUses: 10, usedCount: 3, expiresAt: LATER }];
    expect(await hasWayIn(store({ playlists: [{ id: 1 }], codes }), video, NOW)).toBe(true);
  });

  it('исчерпавший предел код не считается', async () => {
    const codes = [{ maxUses: 5, usedCount: 5, expiresAt: LATER }];
    expect(await hasWayIn(store({ codes }), video, NOW)).toBe(false);
  });

  it('живая ссылка открывает, когда кодов нет', async () => {
    const links = [{ maxUses: null, usedCount: 0, expiresAt: LATER }];
    expect(await hasWayIn(store({ links }), video, NOW)).toBe(true);
  });

  it('исчерпавшая ссылка не считается', async () => {
    const links = [{ maxUses: 1, usedCount: 1, expiresAt: LATER }];
    expect(await hasWayIn(store({ links }), video, NOW)).toBe(false);
  });

  it('просроченное до запроса не доходит - его отсекает сам запрос', async () => {
    // Срок фильтруется на стороне базы, поэтому заглушка просто не вернёт
    // такую запись; проверяем, что решение опирается на возвращённое.
    expect(await hasWayIn(store({ codes: [] }), video, new Date(EARLIER))).toBe(false);
  });
});
