import { describe, expect, it } from 'vitest';

import { positions } from './positions';

describe('число позиций словами', () => {
  it('склоняет по числу', () => {
    expect([1, 3, 5, 11, 21, 22, 112].map(positions)).toEqual([
      '1 позиция',
      '3 позиции',
      '5 позиций',
      '11 позиций',
      '21 позиция',
      '22 позиции',
      '112 позиций',
    ]);
  });
});
