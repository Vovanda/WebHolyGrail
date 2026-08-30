import { describe, expect, it } from 'vitest';

import { redeemLink, type AccessLink } from './redeem-link.js';

const now = new Date('2026-08-30T12:00:00.000Z');
const later = '2026-09-30T12:00:00.000Z';
const earlier = '2026-08-29T12:00:00.000Z';

const link = (over: Partial<AccessLink> = {}): AccessLink => ({
  id: 1,
  resource: { kind: 'playlists', id: 7 },
  revoked: false,
  maxUses: null,
  usedCount: 0,
  expiresAt: later,
  grantDays: null,
  ...over,
});

describe('погашение ссылки-приглашения', () => {
  it('открывает подборку тому, у кого есть адрес, без входа', () => {
    const result = redeemLink({ link: link(), viewerId: null, now });

    expect(result).toEqual({
      ok: true,
      resource: { kind: 'playlists', id: 7 },
      expiresAt: null,
      bind: 'identity',
    });
  });

  it('вошедшему закрепляет право за учётной записью', () => {
    const result = redeemLink({ link: link(), viewerId: 42, now });

    expect(result.ok && result.bind).toBe('account');
  });

  it('открывает и одиночную запись', () => {
    const result = redeemLink({
      link: link({ resource: { kind: 'media', id: 15 } }),
      viewerId: null,
      now,
    });

    expect(result.ok && result.resource).toEqual({ kind: 'media', id: 15 });
  });

  it('считает срок выданного права от дня погашения', () => {
    const result = redeemLink({ link: link({ grantDays: 7 }), viewerId: null, now });

    expect(result.ok && result.expiresAt).toBe('2026-09-06T12:00:00.000Z');
  });

  it('отозванная не открывает, даже пока не кончился срок', () => {
    const result = redeemLink({ link: link({ revoked: true }), viewerId: null, now });

    expect(result).toEqual({ ok: false, reason: 'revoked' });
  });

  it('просроченная не открывает', () => {
    const result = redeemLink({ link: link({ expiresAt: earlier }), viewerId: null, now });

    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('исчерпавшая предел срабатываний не открывает', () => {
    const result = redeemLink({
      link: link({ maxUses: 3, usedCount: 3 }),
      viewerId: null,
      now,
    });

    expect(result).toEqual({ ok: false, reason: 'used-up' });
  });

  it('неизвестный адрес не открывает', () => {
    expect(redeemLink({ link: null, viewerId: null, now })).toEqual({
      ok: false,
      reason: 'not-found',
    });
  });

  it('испорченный срок читается как просроченный, а не как бессрочный', () => {
    const result = redeemLink({ link: link({ expiresAt: 'когда-нибудь' }), viewerId: null, now });

    expect(result).toEqual({ ok: false, reason: 'expired' });
  });
});
