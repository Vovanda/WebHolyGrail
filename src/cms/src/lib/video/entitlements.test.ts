import { describe, expect, it, vi } from 'vitest';

import { entitlementPolicy, type EntitlementSource } from './entitlements.js';

/**
 * Зеркало секции о правах в spec/video/access-invariants.smt2.
 *
 * @remarks
 * Каждый случай отвечает блоку ;@TEST в спеке. Спека ведущая: меняется правило -
 * сначала правится она и гоняется verify_access.py, потом этот файл.
 */

const NOW = new Date('2026-08-26T12:00:00Z');

const policyWith = (hasRight: boolean) => {
  const source: EntitlementSource = { covered: vi.fn(async () => hasRight) };
  return { policy: entitlementPolicy(source, () => NOW), source };
};

const openVideo = { id: 1, access: 'public' as const };
const closedVideo = { id: 2, access: 'private' as const };

describe('политика прав', () => {
  it('открытая запись видна всем, даже покрытая платным доступом', async () => {
    const { policy } = policyWith(false);
    expect(await policy.decide(openVideo, { userId: null })).toEqual({ allowed: true });
  });

  it('открытая запись не требует похода за правами', async () => {
    const { policy, source } = policyWith(false);
    await policy.decide(openVideo, { userId: 42 });
    expect(source.covered).not.toHaveBeenCalled();
  });

  it('закрытая без учётной записи и без маркера не открывается', async () => {
    const { policy } = policyWith(true);
    expect(await policy.decide(closedVideo, { userId: null })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('без учётной записи и без маркера за правами не ходим', async () => {
    const { policy, source } = policyWith(true);
    await policy.decide(closedVideo, { userId: null });
    expect(source.covered).not.toHaveBeenCalled();
  });

  it('живое право на покрывающий доступ открывает', async () => {
    const { policy, source } = policyWith(true);
    expect(await policy.decide(closedVideo, { userId: null, visitorMarker: 'маркер-1' })).toEqual({
      allowed: true,
    });
    expect(source.covered).toHaveBeenCalledWith(
      2,
      { userId: null, visitorMarker: 'маркер-1' },
      NOW,
    );
  });

  it('с маркером, но без права - нужен доступ', async () => {
    const { policy } = policyWith(false);
    expect(await policy.decide(closedVideo, { userId: null, visitorMarker: 'маркер-1' })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('учётная запись без права тоже не открывает', async () => {
    const { policy } = policyWith(false);
    expect(await policy.decide(closedVideo, { userId: 42 })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('своё автор смотрит без всякого права', async () => {
    const { policy, source } = policyWith(false);
    expect(await policy.decide(closedVideo, { userId: 42, ownsVideo: true })).toEqual({
      allowed: true,
    });
    expect(source.covered).not.toHaveBeenCalled();
  });

  it('чужое владение не открывает', async () => {
    const { policy } = policyWith(false);
    expect(await policy.decide(closedVideo, { userId: 42, ownsVideo: false })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('администратор не смотрит чужое', async () => {
    // Управление площадкой не даёт права на чужой платный материал.
    const { policy } = policyWith(false);
    expect(await policy.decide(closedVideo, { userId: 1, ownsVideo: false })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });
});
