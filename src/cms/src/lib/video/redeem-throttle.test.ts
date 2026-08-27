import { beforeEach, describe, expect, it } from 'vitest';

import {
  checkRedeemAttempt,
  forgetRedeemMisses,
  noteRedeemMiss,
  resetRedeemThrottle,
} from './redeem-throttle.js';

/**
 * Код короткий, и без ограничения его подбирают перебором. При этом живой
 * человек ошибается два-три раза подряд, и ему задержки видеть незачем.
 */

const CLIENT = '203.0.113.7';

beforeEach(() => resetRedeemThrottle());

describe('ограничение частоты погашений', () => {
  it('первая попытка проходит', () => {
    expect(checkRedeemAttempt(CLIENT).allowed).toBe(true);
  });

  it('несколько промахов подряд человека не наказывают', () => {
    for (let i = 0; i < 5; i += 1) noteRedeemMiss(CLIENT);
    expect(checkRedeemAttempt(CLIENT).allowed).toBe(true);
  });

  it('перебор упирается в задержку', () => {
    for (let i = 0; i < 6; i += 1) noteRedeemMiss(CLIENT);
    const decision = checkRedeemAttempt(CLIENT);
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('задержка растёт с каждым следующим промахом', () => {
    for (let i = 0; i < 6; i += 1) noteRedeemMiss(CLIENT);
    const first = checkRedeemAttempt(CLIENT).retryAfterSeconds;
    for (let i = 0; i < 3; i += 1) noteRedeemMiss(CLIENT);
    expect(checkRedeemAttempt(CLIENT).retryAfterSeconds).toBeGreaterThan(first);
  });

  it('подошедший код обнуляет счёт промахов', () => {
    for (let i = 0; i < 8; i += 1) noteRedeemMiss(CLIENT);
    expect(checkRedeemAttempt(CLIENT).allowed).toBe(false);
    forgetRedeemMisses(CLIENT);
    expect(checkRedeemAttempt(CLIENT).allowed).toBe(true);
  });

  it('чужие промахи на других не отражаются', () => {
    for (let i = 0; i < 8; i += 1) noteRedeemMiss(CLIENT);
    expect(checkRedeemAttempt('198.51.100.4').allowed).toBe(true);
  });

  it('через десять минут счёт начинается заново', () => {
    const start = 1_000_000;
    for (let i = 0; i < 8; i += 1) noteRedeemMiss(CLIENT, start);
    expect(checkRedeemAttempt(CLIENT, start + 1000).allowed).toBe(false);
    expect(checkRedeemAttempt(CLIENT, start + 11 * 60 * 1000).allowed).toBe(true);
  });
});
