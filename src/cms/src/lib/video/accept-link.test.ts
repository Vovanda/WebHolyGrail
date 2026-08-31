import { describe, expect, it, vi } from 'vitest';

import { acceptLink } from './accept-link.js';

/**
 * Приём ссылки-приглашения: найти, проверить, записать право.
 *
 * @remarks
 * Зеркало секции о ссылке в spec/video/access-invariants.smt2.
 */

const NOW = new Date('2026-08-31T12:00:00.000Z');
const LATER = '2026-09-30T12:00:00.000Z';
const EARLIER = '2026-08-01T12:00:00.000Z';

const link = (over: Record<string, unknown> = {}) => ({
  id: 3,
  access: 7,
  revoked: false,
  expiresAt: LATER,
  maxUses: null,
  usedCount: 0,
  grantDays: null,
  ...over,
});

const store = (doc: Record<string, unknown> | null) => {
  const updated: Array<Record<string, unknown>> = [];
  const created: Array<Record<string, unknown>> = [];
  const payload = {
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'media-access-links') return { docs: doc ? [doc] : [] };
      return { docs: [] };
    }),
    update: vi.fn(async (args: Record<string, unknown>) => {
      updated.push(args);
      return args;
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      created.push(data);
      return { id: 1 };
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  return { payload, updated, created };
};

const holder = { visitorMarker: 'маркер-1' } as const;
const accept = (payload: unknown, token = 'длинный-адрес') =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  acceptLink({ payload: payload as any, token, holder, now: NOW });

describe('приём ссылки-приглашения', () => {
  it('годная ссылка заводит право на тот доступ, от которого выдана', async () => {
    const { payload, created } = store(link());
    const result = await accept(payload);

    expect(result).toMatchObject({ ok: true, accessId: 7 });
    expect(created[0]).toMatchObject({ access: 7, visitorMarker: 'маркер-1', source: 'invite' });
  });

  it('срабатывание засчитывается', async () => {
    const { payload, updated } = store(link({ usedCount: 2 }));
    await accept(payload);

    expect(updated[0]).toMatchObject({
      collection: 'media-access-links',
      id: 3,
      data: { usedCount: 3 },
    });
  });

  it('несуществующий адрес отсекается', async () => {
    const { payload, created } = store(null);
    expect(await accept(payload)).toMatchObject({ ok: false, reason: 'not-found' });
    expect(created).toHaveLength(0);
  });

  it('отозванная ссылка не открывает', async () => {
    const { payload, updated, created } = store(link({ revoked: true }));
    expect(await accept(payload)).toMatchObject({ ok: false, reason: 'revoked' });
    expect(updated).toHaveLength(0);
    expect(created).toHaveLength(0);
  });

  it('просроченная ссылка не открывает', async () => {
    const { payload } = store(link({ expiresAt: EARLIER }));
    expect(await accept(payload)).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('исчерпавшая предел ссылка не открывает', async () => {
    const { payload } = store(link({ maxUses: 5, usedCount: 5 }));
    expect(await accept(payload)).toMatchObject({ ok: false, reason: 'used-up' });
  });

  it('срабатывание засчитывается до записи права', async () => {
    // Иначе одна и та же ссылка, нажатая дважды подряд, сработает сверх предела.
    const order: string[] = [];
    const { payload } = store(link());
    payload.update = vi.fn(async () => {
      order.push('счётчик');
      return {};
    });
    payload.create = vi.fn(async () => {
      order.push('право');
      return { id: 1 };
    });

    await accept(payload);
    expect(order).toEqual(['счётчик', 'право']);
  });

  it('связь приходит документом при большей глубине', async () => {
    const { payload, created } = store(link({ access: { id: 9 } }));
    expect(await accept(payload)).toMatchObject({ ok: true, accessId: 9 });
    expect(created[0]).toMatchObject({ access: 9 });
  });
});
