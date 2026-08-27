import { describe, expect, it } from 'vitest';

import { issueViewerToken, readViewerToken, withGrantedPlaylist } from './envelope.js';

/**
 * Токен несёт ключ конверта и права, добытые кодами. Главное здесь - срок:
 * право на курс живёт неделями, и токен обязан дожить до его конца, иначе
 * зритель добывает новый код каждый вечер.
 */

const SECRET = 'secret-for-tests-only';
const NOW = 1_700_000_000;
const DAY = 24 * 60 * 60;

describe('токен зрителя', () => {
  it('выданный токен читается и пока пуст', () => {
    const token = issueViewerToken(SECRET, NOW);
    const checked = readViewerToken(token.value, SECRET, NOW);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.granted).toEqual([]);
  });

  it('погашенный код дописывает плейлист', () => {
    const token = issueViewerToken(SECRET, NOW);
    const next = withGrantedPlaylist(token.value, 42, SECRET, NOW);
    const checked = readViewerToken(next!, SECRET, NOW);
    // Из токена плейлист приходит строкой: он лежит в подписанной строке.
    expect(checked.ok && checked.granted).toEqual(['42']);
  });

  it('повторное погашение того же кода плейлист не задваивает', () => {
    const token = issueViewerToken(SECRET, NOW);
    const once = withGrantedPlaylist(token.value, 42, SECRET, NOW);
    const twice = withGrantedPlaylist(once!, 42, SECRET, NOW);
    const checked = readViewerToken(twice!, SECRET, NOW);
    expect(checked.ok && checked.granted).toEqual(['42']);
  });

  it('срок продлевается до конца права: курс открыт на месяц', () => {
    const token = issueViewerToken(SECRET, NOW);
    const until = NOW + 30 * DAY;
    const next = withGrantedPlaylist(token.value, 7, SECRET, NOW, until);
    const checked = readViewerToken(next!, SECRET, NOW);
    expect(checked.ok && checked.expires).toBe(until);
  });

  it('короткое право срок не урезает: другое в том же токене живёт дольше', () => {
    const token = issueViewerToken(SECRET, NOW);
    const long = withGrantedPlaylist(token.value, 7, SECRET, NOW, NOW + 30 * DAY);
    const short = withGrantedPlaylist(long!, 8, SECRET, NOW, NOW + 60);
    const checked = readViewerToken(short!, SECRET, NOW);
    expect(checked.ok && checked.expires).toBe(NOW + 30 * DAY);
  });

  it('вечным токен не становится: у срока есть потолок', () => {
    const token = issueViewerToken(SECRET, NOW);
    const next = withGrantedPlaylist(token.value, 7, SECRET, NOW, NOW + 100 * 365 * DAY);
    const checked = readViewerToken(next!, SECRET, NOW);
    expect(checked.ok && checked.expires).toBeLessThan(NOW + 2 * 365 * DAY);
  });

  it('чужая подпись не принимается', () => {
    const token = issueViewerToken(SECRET, NOW);
    expect(readViewerToken(token.value, 'другой-секрет', NOW).ok).toBe(false);
  });

  it('просроченный токен права не даёт', () => {
    const token = issueViewerToken(SECRET, NOW);
    const checked = readViewerToken(token.value, SECRET, NOW + 400 * DAY);
    expect(checked.ok).toBe(false);
    if (!checked.ok) expect(checked.reason).toBe('expired');
  });
});
