import { describe, expect, it } from 'vitest';

import { pickStart } from './backdrop-start';

describe('pickStart', () => {
  it('оставляет хвост записи неначатым', () => {
    expect(pickStart(100, { random: () => 1 })).toBe(92);
  });

  it('короткую запись начинает сначала: делить нечего', () => {
    expect(pickStart(6)).toBe(0);
  });

  it('без длительности начинает сначала', () => {
    expect(pickStart(Number.NaN)).toBe(0);
    expect(pickStart(0)).toBe(0);
  });

  it('соседние круги начинаются в разных местах', () => {
    const values = [0.1, 0.7];
    let call = 0;
    const random = () => values[call++] ?? 0;

    expect(pickStart(100, { random })).not.toBe(pickStart(100, { random }));
  });
});
