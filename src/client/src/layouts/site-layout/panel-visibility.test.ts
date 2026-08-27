import { describe, expect, it } from 'vitest';

import { panelScreenClass } from './panel-visibility';

/**
 * Панель, помеченную «только телефон», нельзя показывать на большом экране:
 * там её место обычно уже занято колонкой, и выходит два одинаковых списка.
 */

describe('для какого экрана панель', () => {
  it('только телефон - прячется на широком', () => {
    expect(panelScreenClass('mobile')).toBe('md:hidden');
  });

  it('только большой экран - прячется на узком', () => {
    expect(panelScreenClass('desktop')).toBe('hidden md:block');
  });

  it('без пометки - показывается везде', () => {
    expect(panelScreenClass('always')).toBe('');
    expect(panelScreenClass(undefined)).toBe('');
  });
});
