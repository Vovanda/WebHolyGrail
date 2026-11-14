import { describe, expect, it, vi } from 'vitest';

import { catalogIndex, entryOf } from './catalog-index';
import type { CatalogCard, CatalogData } from './ports';

const card = (id: number, over: Partial<CatalogCard> = {}): CatalogCard => ({
  id,
  title: `Позиция ${id}`,
  price: 1_000_000_000,
  listPrice: null,
  sku: null,
  stock: null,
  summary: null,
  image: null,
  howToBuy: 'cart',
  deposit: null,
  slug: null,
  section: 'tools',
  specs: {},
  createdAt: '2026-10-01T00:00:00.000Z',
  keywords: '',
  promoUntil: null,
  ...over,
});

describe('позиция индекса', () => {
  it('наличие, скидка и цена - из полей позиции', () => {
    const entry = entryOf(card(1, { price: 850_000_000, listPrice: 1_000_000_000, stock: 0 }));
    expect(entry.item.specs).toMatchObject({ 'in-stock': false, sale: true, price: 850 });
    expect(entry.discount).toBe(15);
  });

  it('без цены - цены нет и скидки нет', () => {
    const entry = entryOf(card(2, { price: null }));
    expect(entry.price).toBeNull();
    expect(entry.item.specs).toMatchObject({ sale: false, price: null });
  });
});

describe('свежесть индекса', () => {
  const setup = (cards: CatalogCard[]) => {
    let clock = 0;
    let version = 'v1';
    const data = (): CatalogData => ({ cards, sections: [] });
    const load = vi.fn(async () => data());
    const index = catalogIndex({
      load,
      version: async () => version,
      checkEveryMs: 1000,
      now: () => clock,
    });
    return {
      index,
      load,
      tick: (ms: number) => (clock += ms),
      bump: (v: string) => (version = v),
    };
  };

  it('без изменений не пересобирается, версию сверяет не чаще раза в секунду', async () => {
    const { index, load, tick } = setup([card(1)]);
    await index.get();
    tick(500);
    await index.get();
    tick(1000);
    await index.get();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('правка в другом экземпляре - прежний снимок сразу, новый после фоновой пересборки', async () => {
    const { index, load, tick, bump } = setup([card(1)]);
    const first = await index.get();
    bump('v2');
    tick(1500);
    expect(await index.get()).toBe(first);
    await index.idle();
    expect(load).toHaveBeenCalledTimes(2);
    expect(await index.get()).not.toBe(first);
  });

  it('наступил конец акции - пересобирается без правки', async () => {
    const { index, load, tick } = setup([card(1, { promoUntil: new Date(5000).toISOString() })]);
    await index.get();
    tick(6000);
    await index.get();
    await index.idle();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('упавшая пересборка оставляет прежний снимок', async () => {
    const { index, load, tick, bump } = setup([card(1)]);
    const first = await index.get();
    load.mockRejectedValueOnce(new Error('база недоступна'));
    bump('v2');
    tick(1500);
    expect(await index.get()).toBe(first);
    await index.idle();
    expect(await index.get()).toBe(first);
  });

  it('одновременные запросы ждут одну пересборку', async () => {
    const { index, load } = setup([card(1)]);
    await Promise.all([index.get(), index.get(), index.get()]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('позиции разложены по разделам', async () => {
    const { index } = setup([card(1), card(2, { section: 'paint' }), card(3)]);
    const snap = await index.get();
    expect(snap.bySection.get('tools')?.map((e) => e.card.id)).toEqual([1, 3]);
  });
});
