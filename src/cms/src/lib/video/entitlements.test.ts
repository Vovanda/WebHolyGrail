import { describe, expect, it, vi } from 'vitest';

import { entitlementPolicy, type EntitlementSource } from './entitlements.js';

/**
 * Зеркало секции о наборах в spec/video/access-invariants.smt2.
 *
 * @remarks
 * Каждый случай отвечает блоку ;@TEST в спеке. Спека ведущая: меняется
 * правило — сначала правится она и гоняется verify_access.py, потом этот файл.
 */

const NOW = new Date('2026-08-26T12:00:00Z');

const policyWith = (entitled: ReadonlyArray<string | number>) => {
  const source: EntitlementSource = {
    entitledPlaylistsFor: vi.fn(async () => entitled),
    playlistsContaining: vi.fn(async () => []),
  };
  return { policy: entitlementPolicy(source, () => NOW), source };
};

const openVideo = { id: 1, access: 'public' as const };
const closedVideo = { id: 2, access: 'private' as const };

describe('доступ с правами на наборы', () => {
  it('открытый ролик виден всем даже в платном наборе', async () => {
    const { policy } = policyWith([]);
    expect(await policy.decide(openVideo, { userId: null })).toEqual({ allowed: true });
  });

  it('открытый ролик не требует похода за правами', async () => {
    // Лишний запрос к базе на каждый открытый ролик — это нагрузка ради
    // случая, который решается сразу.
    const { policy, source } = policyWith([]);
    await policy.decide(openVideo, { userId: 42 });
    expect(source.entitledPlaylistsFor).not.toHaveBeenCalled();
  });

  it('закрытый ролик без входа просит войти', async () => {
    const { policy } = policyWith([]);
    expect(await policy.decide(closedVideo, { userId: null })).toEqual({
      allowed: false,
      reason: 'sign-in-required',
    });
  });

  it('вошёл, но права нет — это другой отказ', async () => {
    // «Войди» и «нужен доступ» ведут на разные кнопки: вход и покупку.
    const { policy } = policyWith([]);
    expect(await policy.decide(closedVideo, { userId: 42 })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('право на набор открывает закрытый ролик', async () => {
    const { policy } = policyWith([7]);
    expect(await policy.decide(closedVideo, { userId: 42 })).toEqual({ allowed: true });
  });

  it('ролик в двух наборах открывается правом на любой', async () => {
    const { policy } = policyWith([9]);
    expect(await policy.decide(closedVideo, { userId: 42 })).toEqual({ allowed: true });
  });

  it('право спрашивается на конкретного зрителя и ролик', async () => {
    const { policy, source } = policyWith([7]);
    await policy.decide(closedVideo, { userId: 42 });
    expect(source.entitledPlaylistsFor).toHaveBeenCalledWith(2, 42, NOW);
  });
});
