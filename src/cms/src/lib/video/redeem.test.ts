import { describe, expect, it } from 'vitest';

import { redeemCode, type AccessCode } from './redeem.js';

/**
 * Погашение кода.
 *
 * @remarks
 * Ошибка здесь дорогая в обе стороны: пустил лишнего — закрытое роздано бесплатно,
 * не пустил купившего — он пришёл с деньгами и упёрся в отказ.
 */

const NOW = new Date('2026-08-26T12:00:00Z');
const daysFromNow = (days: number) =>
  new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
const minutesFromNow = (minutes: number) =>
  new Date(NOW.getTime() + minutes * 60 * 1000).toISOString();

const code = (overrides: Partial<AccessCode> = {}): AccessCode => ({
  id: 1,
  resource: { kind: 'playlists', id: 7 } as const,
  maxUses: null,
  usedCount: 0,
  expiresAt: null,
  grantDays: null,
  ...overrides,
});

const redeem = (c: AccessCode | null, viewerId: string | number | null = 42) =>
  redeemCode({ code: c, viewerId, now: NOW });

describe('погашение кода', () => {
  it('обладатель учётной записи получает право на плейлист', () => {
    const result = redeem(code());
    expect(result).toMatchObject({
      ok: true,
      resource: { kind: 'playlists', id: 7 },
      bind: 'account',
      expiresAt: null,
    });
  });

  it('несуществующий код отсекается', () => {
    expect(redeem(null)).toMatchObject({ ok: false, reason: 'not-found' });
  });

  it('просроченный код не срабатывает', () => {
    expect(redeem(code({ expiresAt: daysFromNow(-1) }))).toMatchObject({
      ok: false,
      reason: 'expired',
    });
  });

  it('исчерпанный лимит не срабатывает', () => {
    expect(redeem(code({ maxUses: 10, usedCount: 10 }))).toMatchObject({
      ok: false,
      reason: 'used-up',
    });
  });

  it('срок проверяется раньше лимита', () => {
    // Просроченный код бессмыслен, даже если срабатываний осталось много —
    // и человеку честнее сказать про срок, а не про лимит.
    const result = redeem(code({ expiresAt: daysFromNow(-1), maxUses: 1, usedCount: 5 }));
    expect(result).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('код срабатывает без учётной записи и вяжется к маркеру', () => {
    // Кто код получил, тот получил и право: код - билет на предъявителя.
    // Держится оно маркером из токена, а не тем, что человек завёл учётную
    // запись. Записывается в обоих случаях - иначе снять его было бы нечем.
    const result = redeem(code({ maxUses: 50 }), null);
    expect(result).toMatchObject({ ok: true, bind: 'identity' });
  });

  it('просроченный код не срабатывает и без учётной записи', () => {
    const result = redeem(code({ expiresAt: daysFromNow(-1) }), null);
    expect(result).toMatchObject({ ok: false, reason: 'expired' });
  });

  it('срок доступа считается от момента погашения, а не от срока кода', () => {
    // Код живёт месяц, а подарок по нему — неделю с того дня, как открыли.
    const result = redeem(code({ grantDays: 7, expiresAt: daysFromNow(30) }));
    expect(result).toMatchObject({ ok: true, expiresAt: daysFromNow(7) });
  });

  it('минуты главнее дней там, где доступ нужен на время показа', () => {
    // Витрина и вебинар открывают на четверть часа: сутки там означают, что
    // вернувшийся через час уже не увидит того, ради чего пришёл.
    const result = redeem(code({ grantMinutes: 15, grantDays: 30 }));
    expect(result).toMatchObject({ ok: true, expiresAt: minutesFromNow(15) });
  });

  it('пустые минуты оставляют счёт по дням', () => {
    expect(redeem(code({ grantMinutes: null, grantDays: 7 }))).toMatchObject({
      ok: true,
      expiresAt: daysFromNow(7),
    });
  });

  it('битая дата срока считается просрочкой', () => {
    // Лучше не пустить по испорченному коду, чем пустить всех.
    expect(redeem(code({ expiresAt: 'не дата' }))).toMatchObject({ ok: false, reason: 'expired' });
  });
});
