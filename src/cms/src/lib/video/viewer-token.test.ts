import { describe, expect, it } from 'vitest';

import { issueViewerToken, readViewerToken, withExtendedLife } from './viewer-token.js';

/**
 * Токен несёт срок и идентичность зрителя - прав в нём нет, они лежат
 * записями. Главное здесь - срок: право на курс живёт неделями, и токен обязан
 * дожить до его конца, иначе зритель добывает новый код каждый вечер.
 *
 * Второе по важности - неизменность идентичности. Сменить его посреди работы
 * значит отрезать зрителя от собственных прав: находятся они именно по нему.
 */

const SECRET = 'secret-for-tests-only';
const NOW = 1_700_000_000;
const DAY = 24 * 60 * 60;

describe('токен зрителя', () => {
  it('выданный токен читается и несёт идентичность', () => {
    const token = issueViewerToken(SECRET, NOW);
    const checked = readViewerToken(token.value, SECRET, NOW);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.ref).toBe(token.ref);
  });

  it('идентичность у двух зрителей разное: по нему и различаются права', () => {
    const mine = issueViewerToken(SECRET, NOW);
    const other = issueViewerToken(SECRET, NOW);
    expect(mine.ref).not.toBe(other.ref);
  });

  it('продление идентичность сохраняет: иначе право по нему не найдётся', () => {
    const token = issueViewerToken(SECRET, NOW);
    const next = withExtendedLife(token.value, SECRET, NOW, NOW + 30 * DAY);
    const checked = readViewerToken(next!, SECRET, NOW);
    expect(checked.ok && checked.ref).toBe(token.ref);
  });

  it('продление сохраняет идентичность: смена отрезала бы зрителя от его прав', () => {
    const token = issueViewerToken(SECRET, NOW);
    const next = withExtendedLife(token.value, SECRET, NOW, NOW + 30 * DAY);
    const checked = readViewerToken(next!, SECRET, NOW);
    expect(checked.ok && checked.ref).toBe(token.ref);
  });

  it('срок продлевается до конца права: курс открыт на месяц', () => {
    const token = issueViewerToken(SECRET, NOW);
    const until = NOW + 30 * DAY;
    const next = withExtendedLife(token.value, SECRET, NOW, until);
    const checked = readViewerToken(next!, SECRET, NOW);
    expect(checked.ok && checked.expires).toBe(until);
  });

  it('короткое право срок не урезает: другое право того же зрителя живёт дольше', () => {
    const token = issueViewerToken(SECRET, NOW);
    const long = withExtendedLife(token.value, SECRET, NOW, NOW + 30 * DAY);
    const short = withExtendedLife(long!, SECRET, NOW, NOW + 60);
    const checked = readViewerToken(short!, SECRET, NOW);
    expect(checked.ok && checked.expires).toBe(NOW + 30 * DAY);
  });

  it('вечным токен не становится: у срока есть потолок', () => {
    const token = issueViewerToken(SECRET, NOW);
    const next = withExtendedLife(token.value, SECRET, NOW, NOW + 100 * 365 * DAY);
    const checked = readViewerToken(next!, SECRET, NOW);
    expect(checked.ok && checked.expires).toBeLessThan(NOW + 2 * 365 * DAY);
  });

  it('продлить испорченный токен нельзя: идентичности в нём нет', () => {
    expect(withExtendedLife('не.токен.вовсе', SECRET, NOW, NOW + DAY)).toBeNull();
  });

  it('чужая подпись не принимается', () => {
    const token = issueViewerToken(SECRET, NOW);
    expect(readViewerToken(token.value, 'другой-секрет', NOW).ok).toBe(false);
  });

  it('подменённая идентичность подпись не проходит: чужие права не забрать', () => {
    const token = issueViewerToken(SECRET, NOW);
    const parts = token.value.split('.');
    const tampered = [parts[0], 'чужое-идентичность', parts[2]].join('.');
    expect(readViewerToken(tampered, SECRET, NOW)).toMatchObject({
      ok: false,
      reason: 'signature',
    });
  });

  it('просроченный токен не читается', () => {
    const token = issueViewerToken(SECRET, NOW);
    const checked = readViewerToken(token.value, SECRET, NOW + 400 * DAY);
    expect(checked.ok).toBe(false);
    if (!checked.ok) expect(checked.reason).toBe('expired');
  });
});
