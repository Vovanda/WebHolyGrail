import { describe, expect, it } from 'vitest';

import {
  disabledBlocks,
  reservedRoute,
  isModuleEnabled,
  MODULES,
  moduleOfBlock,
  moduleOfCollection,
  moduleToggleKey,
} from './modules';

describe('модули движка', () => {
  it('у каждой коллекции и блока не больше одного модуля', () => {
    const collections = MODULES.flatMap((m) => [...m.collections]);
    const blocks = MODULES.flatMap((m) => [...m.blocks]);
    expect(new Set(collections).size).toBe(collections.length);
    expect(new Set(blocks).size).toBe(blocks.length);
  });

  it('контент и медиа не входят в модули и всегда включены', () => {
    expect(moduleOfCollection('pages')).toBeNull();
    expect(moduleOfCollection('media')).toBeNull();
    expect(isModuleEnabled({}, moduleOfCollection('pages'))).toBe(true);
  });

  it('нет записи переключателя - модуль включён (R10); выключен - только явно', () => {
    expect(isModuleEnabled({}, 'blog')).toBe(true);
    expect(isModuleEnabled({ [moduleToggleKey('blog')]: false }, 'blog')).toBe(false);
    expect(moduleOfCollection('articles')).toBe('blog');
    expect(moduleOfBlock('shop-cart')).toBe('shop');
  });

  it('блоки выключенного модуля нельзя ставить, остальные можно', () => {
    const off = disabledBlocks({ [moduleToggleKey('shop')]: false });
    expect(off).toEqual(['shop-showcase', 'shop-cart']);
    expect(off).not.toContain('articles-section');
  });

  it('у нового сайта из модулей включён только блог', () => {
    expect(MODULES.filter((m) => m.onNewSite).map((m) => m.key)).toEqual(['blog']);
  });
});

describe('зарезервированные адреса', () => {
  it('страница не занимает адрес модуля или движка, включённого или нет', () => {
    expect(reservedRoute('shop/cart')).toBe('shop');
    expect(reservedRoute('/Orders')).toBe('orders');
    expect(reservedRoute('api')).toBe('api');
    expect(reservedRoute('shopping')).toBeNull();
    expect(reservedRoute('contacts/visit')).toBeNull();
    expect(reservedRoute('')).toBeNull();
  });
});
