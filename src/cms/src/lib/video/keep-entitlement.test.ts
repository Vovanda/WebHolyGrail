import { describe, expect, it } from 'vitest';

import { planEntitlement } from './keep-entitlement.js';

/**
 * Право вошедшего живёт в базе, поэтому ошибка здесь либо плодит одинаковые
 * записи, либо укорачивает уже выданный доступ.
 */

describe('право заводится', () => {
  it('когда его ещё нет', () => {
    expect(planEntitlement(null, '2026-12-31T00:00:00.000Z')).toEqual({
      kind: 'create',
      expiresAt: '2026-12-31T00:00:00.000Z',
    });
  });

  it('бессрочным, когда у кода нет срока', () => {
    expect(planEntitlement(null, null)).toEqual({ kind: 'create', expiresAt: null });
  });
});

describe('право продлевается', () => {
  it('когда новый срок дальше прежнего', () => {
    const plan = planEntitlement(
      { id: 7, expiresAt: '2026-09-01T00:00:00.000Z' },
      '2026-12-31T00:00:00.000Z',
    );
    expect(plan).toEqual({ kind: 'extend', id: 7, expiresAt: '2026-12-31T00:00:00.000Z' });
  });

  it('до бессрочного', () => {
    const plan = planEntitlement({ id: 7, expiresAt: '2026-09-01T00:00:00.000Z' }, null);
    expect(plan).toEqual({ kind: 'extend', id: 7, expiresAt: null });
  });
});

describe('право не трогается', () => {
  it('когда новый срок ближе прежнего', () => {
    expect(
      planEntitlement({ id: 7, expiresAt: '2026-12-31T00:00:00.000Z' }, '2026-09-01T00:00:00.000Z'),
    ).toEqual({ kind: 'keep' });
  });

  it('когда оно уже бессрочно', () => {
    expect(planEntitlement({ id: 7, expiresAt: null }, '2026-09-01T00:00:00.000Z')).toEqual({
      kind: 'keep',
    });
  });

  it('когда новая дата негодная', () => {
    expect(planEntitlement({ id: 7, expiresAt: '2026-09-01T00:00:00.000Z' }, 'вчера')).toEqual({
      kind: 'keep',
    });
  });
});

describe('негодная дата в базе', () => {
  it('заменяется новой: сломанное право чинится, а не остаётся', () => {
    expect(planEntitlement({ id: 7, expiresAt: 'позавчера' }, '2026-12-31T00:00:00.000Z')).toEqual({
      kind: 'extend',
      id: 7,
      expiresAt: '2026-12-31T00:00:00.000Z',
    });
  });
});
