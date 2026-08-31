import { describe, expect, it, vi } from 'vitest';

import { writeEntitlement } from './write-entitlement.js';

/**
 * Запись права: завести новое или продлить выданное.
 *
 * @remarks
 * Зеркало проверок спеки о повторной активации.
 */

const NOW = '2026-09-30T12:00:00.000Z';
const EARLIER = '2026-09-01T12:00:00.000Z';

const store = (existing: Record<string, unknown> | null) => {
  const created: Array<Record<string, unknown>> = [];
  const updated: Array<Record<string, unknown>> = [];
  const payload = {
    find: vi.fn(async () => ({ docs: existing ? [existing] : [] })),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      created.push(data);
      return { id: 1 };
    }),
    update: vi.fn(async (args: Record<string, unknown>) => {
      updated.push(args);
      return { id: 1 };
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  return { payload, created, updated };
};

const marker = { visitorMarker: 'маркер-1' } as const;
const account = { userId: 42 } as const;

describe('запись права', () => {
  it('первое право заводится на маркер посетителя', async () => {
    const { payload, created } = store(null);
    const result = await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: NOW,
      source: 'promo',
    });

    expect(result).toBe('created');
    expect(created[0]).toMatchObject({
      visitorMarker: 'маркер-1',
      access: 7,
      source: 'promo',
      expiresAt: NOW,
    });
  });

  it('источник записывается номером: по праву видно, чем оно получено', async () => {
    const { payload, created } = store(null);
    await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: NOW,
      source: 'promo',
      sourceRef: 'ABC123',
    });

    expect(created[0]).toMatchObject({ source: 'promo', sourceRef: 'ABC123' });
  });

  it('выданное рукой остаётся без номера', async () => {
    // Иначе в списке появлялась бы пустая строка, которую нечем объяснить.
    const { payload, created } = store(null);
    await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: NOW,
      source: 'manual',
    });

    expect(created[0]).not.toHaveProperty('sourceRef');
  });

  it('право на учётную запись держится ею, а не маркером', async () => {
    const { payload, created } = store(null);
    await writeEntitlement({
      payload,
      holder: account,
      target: { accessId: 7 },
      grantedUntil: null,
      source: 'payment',
    });

    expect(created[0]).toMatchObject({ viewer: 42, access: 7 });
    expect(created[0]).not.toHaveProperty('visitorMarker');
  });

  it('повторная активация продлевает, а не заводит второе право', async () => {
    const { payload, created, updated } = store({ id: 5, expiresAt: EARLIER });
    const result = await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: NOW,
      source: 'promo',
    });

    expect(result).toBe('extended');
    expect(created).toHaveLength(0);
    expect(updated[0]).toMatchObject({ id: 5, data: { expiresAt: NOW } });
  });

  it('бессрочное право коротким сроком не укорачивается', async () => {
    const { payload, updated } = store({ id: 5, expiresAt: null });
    const result = await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: NOW,
      source: 'promo',
    });

    expect(result).toBe('kept');
    expect(updated).toHaveLength(0);
  });

  it('бессрочная выдача перекрывает срочное право', async () => {
    const { payload, updated } = store({ id: 5, expiresAt: EARLIER });
    const result = await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: null,
      source: 'manual',
    });

    expect(result).toBe('extended');
    expect(updated[0]).toMatchObject({ id: 5, data: { expiresAt: null } });
  });

  it('вошедший с маркером находит своё прежнее право, а не заводит второе', async () => {
    // Признаки ищутся все сразу: иначе один покупатель выглядит в списке двумя.
    const { payload, created, updated } = store({ id: 5, expiresAt: EARLIER });
    const result = await writeEntitlement({
      payload,
      holder: { userId: 42, visitorMarker: 'маркер-1' },
      target: { accessId: 7 },
      grantedUntil: NOW,
      source: 'payment',
    });

    expect(result).toBe('extended');
    expect(created).toHaveLength(0);
    expect(updated[0]).toMatchObject({ id: 5 });
  });

  it('известные признаки записываются рядом', async () => {
    const { payload, created } = store(null);
    await writeEntitlement({
      payload,
      holder: { userId: 42, visitorMarker: 'маркер-1', email: 'kto@to.ru' },
      target: { accessId: 7 },
      grantedUntil: null,
      source: 'payment',
    });

    expect(created[0]).toMatchObject({
      viewer: 42,
      visitorMarker: 'маркер-1',
      email: 'kto@to.ru',
    });
  });

  it('пометка записывается, когда она есть', async () => {
    const { payload, created } = store(null);
    await writeEntitlement({
      payload,
      holder: marker,
      target: { accessId: 7 },
      grantedUntil: null,
      source: 'invite',
      note: 'Ссылка abc123…',
    });

    expect(created[0]).toMatchObject({ note: 'Ссылка abc123…' });
  });
});
