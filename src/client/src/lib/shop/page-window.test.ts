import { describe, expect, it } from 'vitest';

import { pageWindow } from '@/blocks/primitives/Shop/CatalogPager';

describe('номера страниц', () => {
  it('мало страниц - все', () => expect(pageWindow(1, 3)).toEqual([1, 2, 3]));
  it('много - окно с многоточием', () => {
    expect(pageWindow(10, 334)).toEqual([1, null, 8, 9, 10, 11, 12, null, 334]);
    expect(pageWindow(1, 334)).toEqual([1, 2, 3, null, 334]);
  });
});
