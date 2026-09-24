import { describe, expect, it } from 'vitest';

import { cardPlace } from './carousel';

describe('место кадра карточки карусели', () => {
  it('одиночный слайд идёт во всю ширину колонки', () => {
    expect(cardPlace({ mode: 'single' })).toBe('(max-width: 768px) 100vw, 1200px');
  });

  it('ширина карточки в единицах браузера и есть место', () => {
    expect(cardPlace({ cardWidth: '22rem' })).toBe('22rem');
  });

  it('доля от стороннего и пустое дают ширину по умолчанию', () => {
    expect(cardPlace({ cardWidth: '30%' })).toBe('min(18rem, 80vw)');
    expect(cardPlace({})).toBe('min(18rem, 80vw)');
  });
});
