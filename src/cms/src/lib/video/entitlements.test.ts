import { describe, expect, it, vi } from 'vitest';

import { entitlementPolicy, type EntitlementSource } from './entitlements.js';

/**
 * Зеркало секции о плейлистах в spec/video/access-invariants.smt2.
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

describe('доступ с правами на плейлисты', () => {
  it('открытый видео виден всем даже в платном плейлисте', async () => {
    const { policy } = policyWith([]);
    expect(await policy.decide(openVideo, { userId: null })).toEqual({ allowed: true });
  });

  it('открытый видео не требует похода за правами', async () => {
    // Лишний запрос к базе на каждый открытый видео — это нагрузка ради
    // случая, который решается сразу.
    const { policy, source } = policyWith([]);
    await policy.decide(openVideo, { userId: 42 });
    expect(source.entitledPlaylistsFor).not.toHaveBeenCalled();
  });

  it('закрытый видео без входа просит войти', async () => {
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

  it('право на плейлист открывает закрытый видео', async () => {
    const { policy } = policyWith([7]);
    expect(await policy.decide(closedVideo, { userId: 42 })).toEqual({ allowed: true });
  });

  it('видео в двух плейлистах открывается правом на любой', async () => {
    const { policy } = policyWith([9]);
    expect(await policy.decide(closedVideo, { userId: 42 })).toEqual({ allowed: true });
  });

  it('право спрашивается на конкретного зрителя и видео', async () => {
    const { policy, source } = policyWith([7]);
    await policy.decide(closedVideo, { userId: 42 });
    expect(source.entitledPlaylistsFor).toHaveBeenCalledWith(2, 42, NOW);
  });

  it('владелец смотрит своё', async () => {
    // Иначе перед публикацией нельзя убедиться, что залит нужный файл.
    const { policy, source } = policyWith([]);
    expect(await policy.decide(closedVideo, { userId: 42, ownsVideo: true })).toEqual({
      allowed: true,
    });
    // За правами при этом не ходим: покупать доступ к своему не у кого.
    expect(source.entitledPlaylistsFor).not.toHaveBeenCalled();
  });

  it('чужое владение не открывает', async () => {
    const { policy } = policyWith([]);
    expect(await policy.decide(closedVideo, { userId: 42, ownsVideo: false })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('администратор не смотрит чужое', async () => {
    // Управление площадкой не должно означать возможность выкачать чужую
    // платную подборку.
    const { policy } = policyWith([]);
    expect(await policy.decide(closedVideo, { userId: 1, ownsVideo: false })).toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });
});
