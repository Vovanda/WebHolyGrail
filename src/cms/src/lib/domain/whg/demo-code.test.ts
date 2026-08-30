import { describe, expect, it, vi } from 'vitest';

import { issueDemoCode } from './demo-code.js';

/** Выдача демонстрационного кода. */

const LATER = '2026-09-30T12:00:00.000Z';

const store = (docs: {
  accesses?: ReadonlyArray<{ id: number }>;
  codes?: ReadonlyArray<{ id: number }>;
}) => {
  const created: Array<Record<string, unknown>> = [];
  const updated: Array<Record<string, unknown>> = [];
  const payload = {
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'media-accesses') return { docs: docs.accesses ?? [] };
      return { docs: docs.codes ?? [] };
    }),
    create: vi.fn(async (args: { collection: string; data: Record<string, unknown> }) => {
      created.push({ collection: args.collection, ...args.data });
      return { id: 42 };
    }),
    update: vi.fn(async (args: Record<string, unknown>) => {
      updated.push(args);
      return args;
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  return { payload, created, updated };
};

const issue = (payload: unknown) =>
  issueDemoCode({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: payload as any,
    playlistId: 1,
    length: 6,
    expiresAt: LATER,
    grantMinutes: 15,
  });

describe('демонстрационный код', () => {
  it('печатается от доступа, покрывающего подборку', async () => {
    const { payload, created } = store({ accesses: [{ id: 7 }] });
    const result = await issue(payload);

    expect(result.code).toHaveLength(6);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      collection: 'media-access-codes',
      access: 7,
      maxUses: 1,
      usedCount: 0,
      grantMinutes: 15,
    });
  });

  it('доступа нет - заводится один раз', async () => {
    const { payload, created } = store({ accesses: [] });
    await issue(payload);

    expect(created[0]).toMatchObject({
      collection: 'media-accesses',
      title: 'Демонстрационный доступ',
      playlists: [1],
    });
    expect(created[1]).toMatchObject({ collection: 'media-access-codes', access: 42 });
  });

  it('совпавшее значение переписывается, а не плодит второй код', async () => {
    const { payload, created, updated } = store({ accesses: [{ id: 7 }], codes: [{ id: 5 }] });
    await issue(payload);

    expect(created).toHaveLength(0);
    expect(updated[0]).toMatchObject({
      collection: 'media-access-codes',
      id: 5,
      data: { usedCount: 0, access: 7 },
    });
  });

  it('срок кода отдаётся тот же, что записан', async () => {
    const { payload } = store({ accesses: [{ id: 7 }] });
    expect((await issue(payload)).expiresAt).toBe(LATER);
  });
});
