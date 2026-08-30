import { describe, expect, it } from 'vitest';

import { generateLinkToken, looksLikeLinkToken } from './link-token.js';

describe('адрес ссылки-приглашения', () => {
  it('рождается заданной длины', () => {
    expect(generateLinkToken()).toHaveLength(22);
    expect(generateLinkToken(30)).toHaveLength(30);
  });

  it('состоит только из символов своего алфавита', () => {
    expect(generateLinkToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('не повторяется на большой выборке', () => {
    const seen = new Set(Array.from({ length: 3000 }, () => generateLinkToken()));
    expect(seen.size).toBe(3000);
  });

  it('узнаётся по длине и алфавиту', () => {
    expect(looksLikeLinkToken(generateLinkToken())).toBe(true);
    expect(looksLikeLinkToken('короткий')).toBe(false);
    // Код доступа шестизначный - за адрес ссылки его принять нельзя.
    expect(looksLikeLinkToken('50Z837')).toBe(false);
  });
});
