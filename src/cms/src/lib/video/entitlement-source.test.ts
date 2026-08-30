import { describe, expect, it, vi } from 'vitest';

import { accessContents, payloadEntitlements } from './entitlement-source.js';

/**
 * Зеркало секций о доступе и праве в spec/video/access-invariants.smt2.
 *
 * @remarks
 * Проверяем решение, а не запросы: подборки, доступы и права задаются прямо,
 * поэтому видно, какой набор данных к какому ответу приводит.
 */

const NOW = new Date('2026-08-31T12:00:00.000Z');
const LATER = '2026-09-30T12:00:00.000Z';
const EARLIER = '2026-08-01T12:00:00.000Z';

const VIDEO = 69;
const MARKER = 'маркер-1';

type Doc = Record<string, unknown>;

/**
 * Хранилище-заглушка.
 *
 * @remarks
 * Запоминает условия запросов: по ним видно, что источник спросил доступы
 * прежде прав и не пошёл за правами, когда покрывающих доступов нет.
 */
const store = (docs: {
  playlists?: ReadonlyArray<{ id: number }>;
  accesses?: ReadonlyArray<Doc>;
  rights?: ReadonlyArray<Doc>;
  access?: Doc | null;
}) => {
  const asked: string[] = [];
  const payload = {
    find: vi.fn(async ({ collection }: { collection: string }) => {
      asked.push(collection);
      if (collection === 'playlists') return { docs: docs.playlists ?? [] };
      if (collection === 'media-accesses') return { docs: docs.accesses ?? [] };
      return { docs: docs.rights ?? [] };
    }),
    findByID: vi.fn(async () => {
      if (!docs.access) throw new Error('нет такого доступа');
      return docs.access;
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  return { payload, asked };
};

const who = { userId: null, visitorMarker: MARKER };

describe('право на доступ, покрывающий запись', () => {
  it('живое право на покрывающий доступ открывает', async () => {
    const { payload } = store({
      accesses: [{ id: 1, cutoff: null }],
      rights: [{ id: 10, expiresAt: null, maxViews: null, views: 0 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(true);
  });

  it('без покрывающих доступов за правами не ходим', async () => {
    // Дешёвая проверка раньше дорогой: прав может быть много, а доступов,
    // покрывающих запись, обычно ноль или один.
    const { payload, asked } = store({ accesses: [] });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(false);
    expect(asked).not.toContain('media-access-rights');
  });

  it('отсечка доступа закрывает запись, хотя личное право бессрочно', async () => {
    const { payload } = store({
      accesses: [{ id: 1, cutoff: EARLIER }],
      rights: [{ id: 10, expiresAt: null, maxViews: null, views: 0 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(false);
  });

  it('личный срок короче общего закрывает раньше отсечки', async () => {
    const { payload } = store({
      accesses: [{ id: 1, cutoff: LATER }],
      rights: [{ id: 10, expiresAt: EARLIER, maxViews: null, views: 0 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(false);
  });

  it('исчерпанный счёт просмотров больше не открывает', async () => {
    const { payload } = store({
      accesses: [{ id: 1, cutoff: null }],
      rights: [{ id: 10, expiresAt: null, maxViews: 3, views: 3 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(false);
  });

  it('незаполненный предел просмотров ограничением не считается', async () => {
    // Ноль и пусто значат «без ограничения»: это отсутствие условия,
    // а не условие «ноль».
    const { payload } = store({
      accesses: [{ id: 1, cutoff: null }],
      rights: [{ id: 10, expiresAt: null, maxViews: 0, views: 42 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(true);
  });

  it('прав нет вовсе - не открывает', async () => {
    const { payload } = store({ accesses: [{ id: 1, cutoff: null }], rights: [] });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(false);
  });

  it('запись открывается правом на любой из покрывающих доступов', async () => {
    const { payload } = store({
      accesses: [
        { id: 1, cutoff: EARLIER },
        { id: 2, cutoff: null },
      ],
      rights: [{ id: 10, expiresAt: null, maxViews: null, views: 0 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(true);
  });

  it('без учётной записи и без маркера искать право не по чему', async () => {
    const { payload, asked } = store({ accesses: [{ id: 1, cutoff: null }] });
    const nobody = { userId: null };
    expect(await payloadEntitlements(payload).covered(VIDEO, nobody, NOW)).toBe(false);
    expect(asked).toHaveLength(0);
  });

  it('доступ через подборку, в которой лежит запись, тоже покрывает', async () => {
    const { payload, asked } = store({
      playlists: [{ id: 5 }],
      accesses: [{ id: 1, cutoff: null }],
      rights: [{ id: 10, expiresAt: null, maxViews: null, views: 0 }],
    });
    expect(await payloadEntitlements(payload).covered(VIDEO, who, NOW)).toBe(true);
    expect(asked).toContain('playlists');
  });
});

describe('состав доступа', () => {
  it('отдаёт подборки и отдельные записи', async () => {
    const { payload } = store({ access: { playlists: [5, 7], videos: [69] } });
    expect(await accessContents(payload, 1)).toEqual([
      { kind: 'playlists', id: 5 },
      { kind: 'playlists', id: 7 },
      { kind: 'media', id: 69 },
    ]);
  });

  it('связь приходит документом при большей глубине', async () => {
    const { payload } = store({ access: { playlists: [{ id: 5 }], videos: [] } });
    expect(await accessContents(payload, 1)).toEqual([{ kind: 'playlists', id: 5 }]);
  });

  it('пустой состав - пустой список', async () => {
    const { payload } = store({ access: {} });
    expect(await accessContents(payload, 1)).toEqual([]);
  });

  it('доступа нет - пустой список, а не падение', async () => {
    const { payload } = store({ access: null });
    expect(await accessContents(payload, 404)).toEqual([]);
  });
});
