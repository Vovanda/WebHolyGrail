import { describe, expect, it } from 'vitest';

import { parseCart } from './cart';

describe('корзина из хранилища', () => {
  it('битая строка и чужой формат - пустая корзина', () => {
    expect(parseCart('{')).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
    expect(parseCart(null)).toEqual([]);
  });

  it('повторы склеиваются, мусор выбрасывается', () => {
    expect(
      parseCart(
        JSON.stringify([{ offer: 1, quantity: 1 }, { offer: 1, quantity: 2 }, { offer: 'x' }]),
      ),
    ).toEqual([{ offer: 1, quantity: 3 }]);
  });
});
