import { beforeEach, describe, expect, it } from 'vitest';

import { checkKeyRate, resetKeyRate } from './key-rate.js';

/**
 * Разница между просмотром и выкачиванием видна по частоте: зритель просит ключ
 * раз в несколько минут, скачиватель - десятками подряд.
 */

const VIEWER = 'viewer-1';

beforeEach(() => resetKeyRate());

describe('частота выдачи ключей', () => {
  it('обычный просмотр проходит', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(checkKeyRate(VIEWER).allowed).toBe(true);
    }
  });

  it('десяток уроков подряд порога не задевает', () => {
    for (let i = 0; i < 60; i += 1) {
      expect(checkKeyRate(VIEWER).allowed).toBe(true);
    }
  });

  it('выкачивание курса упирается в порог', () => {
    for (let i = 0; i < 60; i += 1) checkKeyRate(VIEWER);
    const decision = checkKeyRate(VIEWER);
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('счёт у каждого зрителя свой', () => {
    for (let i = 0; i < 61; i += 1) checkKeyRate(VIEWER);
    expect(checkKeyRate('viewer-2').allowed).toBe(true);
  });

  it('через час счёт начинается заново', () => {
    const start = 1_000_000;
    for (let i = 0; i < 61; i += 1) checkKeyRate(VIEWER, start);
    expect(checkKeyRate(VIEWER, start + 1000).allowed).toBe(false);
    expect(checkKeyRate(VIEWER, start + 61 * 60 * 1000).allowed).toBe(true);
  });
});
