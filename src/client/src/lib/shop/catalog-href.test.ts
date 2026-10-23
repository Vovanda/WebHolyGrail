import { cleanCharacteristics, withShopCharacteristics } from 'contracts';
import { describe, expect, it } from 'vitest';

import { catalogHref } from './catalog-href';

describe('адрес выдачи', () => {
  const chars = withShopCharacteristics(
    cleanCharacteristics([{ key: 'brand', title: 'Бренд', kind: 'enum' }]),
  );

  it('без условий и запроса - голый адрес', () => {
    expect(catalogHref('/shop/tools', {}, chars)).toBe('/shop/tools');
  });

  it('условия в порядке характеристик, запрос в конце', () => {
    const href = catalogHref(
      '/shop/tools',
      { brand: { values: ['A'] }, 'in-stock': { values: ['да'] } },
      chars,
      'дрель',
    );
    expect(decodeURIComponent(href)).toBe('/shop/tools?in-stock=да&brand=A&q=дрель');
  });
});
