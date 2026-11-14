import { beforeEach, describe, expect, it } from 'vitest';

import { RULES, resetThrottle, take, throttleSize } from './throttle';

describe('лимиты частоты', () => {
  beforeEach(() => resetThrottle());

  it('после предела отказ, через окно снова можно', () => {
    const { limit, windowMs } = RULES.placeOrder;
    for (let i = 0; i < limit; i += 1) expect(take('placeOrder', 'a', 0).allowed).toBe(true);
    expect(take('placeOrder', 'a', 1).allowed).toBe(false);
    expect(take('placeOrder', 'a', windowMs).allowed).toBe(true);
  });

  it('окна тысяч разовых адресов уходят, когда истекли: счёт свежих не сбивается', () => {
    const { windowMs } = RULES.buyerAction;
    for (let i = 0; i < 10_000; i += 1) take('buyerAction', `bot-${i}`, 0);
    // Новый адрес после истечения окон: таблица чистится, свежий счёт живёт дальше.
    for (let i = 0; i < 3; i += 1) take('buyerAction', 'fresh', windowMs + 1);
    expect(throttleSize()).toBe(1);
    const { limit } = RULES.buyerAction;
    for (let i = 3; i < limit; i += 1) take('buyerAction', 'fresh', windowMs + 2);
    expect(take('buyerAction', 'fresh', windowMs + 3).allowed).toBe(false);
  });
});
