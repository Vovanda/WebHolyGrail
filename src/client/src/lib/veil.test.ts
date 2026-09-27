import { describe, expect, it } from 'vitest';

import { veilOpacity } from './veil';

describe('вуаль', () => {
  it('процент переводится в долю', () => {
    expect(veilOpacity(30, 60)).toBe(0.3);
  });

  it('пусто - умолчание', () => {
    expect(veilOpacity(null, 40)).toBe(0.4);
    expect(veilOpacity(undefined, 40)).toBe(0.4);
  });

  it('за пределами - к краю: не меньше 0 и не больше 95', () => {
    expect(veilOpacity(-10, 40)).toBe(0);
    expect(veilOpacity(120, 40)).toBe(0.95);
  });
});
