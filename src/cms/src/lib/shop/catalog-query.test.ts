import { cleanCharacteristics } from 'contracts';
import { describe, expect, it } from 'vitest';

import { snapshotOf } from './catalog-index';
import { queryCatalog } from './catalog-query';
import type { CatalogCard } from './ports';

const card = (id: number, over: Partial<CatalogCard> = {}): CatalogCard => ({
  id,
  title: `Перфоратор ${id}`,
  price: (1000 + id * 100) * 1_000_000,
  listPrice: null,
  sku: null,
  stock: null,
  summary: null,
  image: null,
  howToBuy: 'cart',
  deposit: null,
  slug: null,
  section: 'tools',
  specs: { brand: id % 2 ? 'A' : 'B' },
  createdAt: `2026-10-${String(10 + id).padStart(2, '0')}T00:00:00.000Z`,
  keywords: '',
  promoUntil: null,
  ...over,
});

const tools = {
  slug: 'tools',
  title: 'Инструмент',
  description: null,
  characteristics: cleanCharacteristics([{ key: 'brand', title: 'Бренд', kind: 'enum' }]),
};
const paint = { slug: 'paint', title: 'Краски', description: null, characteristics: [] };

const snapshot = snapshotOf({
  cards: [
    ...Array.from({ length: 40 }, (_, i) => card(i + 1)),
    card(100, { section: 'paint', title: 'Краска белая' }),
  ],
  sections: [tools, paint],
});

describe('выдача каталога по индексу', () => {
  it('раздел страницами по 30, характеристики общие и раздела', () => {
    const r = queryCatalog(snapshot, 'tools', {})!;
    expect(r.entries).toHaveLength(30);
    expect(r).toMatchObject({ total: 40, pages: 2, page: 1 });
    expect(r.characteristics.map((c) => c.key)).toEqual(['in-stock', 'sale', 'price', 'brand']);
    expect(queryCatalog(snapshot, 'tools', { page: '2' })!.entries).toHaveLength(10);
  });

  it('фильтр, сортировка и счёт вместе', () => {
    const r = queryCatalog(snapshot, 'tools', { brand: 'A', sort: 'price-desc' })!;
    expect(r.total).toBe(20);
    expect(r.entries[0]!.card.id).toBe(39);
    const brand = r.facets.find((f) => f.key === 'brand');
    expect(brand?.view === 'checks' && brand.options.map((o) => o.count)).toEqual([20, 20]);
  });

  it('поиск по магазину без раздела находит в любом', () => {
    const r = queryCatalog(snapshot, null, { q: 'краска' })!;
    expect(r.entries.map((e) => e.card.id)).toEqual([100]);
    expect(r.previews).toEqual([]);
  });

  it('/shop без условий - начало раздела и хвост для кольца ленты', () => {
    const r = queryCatalog(snapshot, null, {})!;
    expect(
      r.previews.map((p) => [p.section.slug, p.section.count, p.entries.length, p.tail.length]),
    ).toEqual([
      ['tools', 40, 12, 4],
      ['paint', 1, 1, 0],
    ]);
    const tools = r.previews[0]!;
    const pool = snapshot.bySection.get('tools')!;
    expect(tools.tail.map((e) => e.card.id)).toEqual(pool.slice(-4).map((e) => e.card.id));
  });

  it('поиск по названию раздела и другим названиям', () => {
    const snap = snapshotOf({
      cards: [card(1), card(2, { title: 'Модель X', keywords: 'роутер' })],
      sections: [tools],
    });
    expect(queryCatalog(snap, null, { q: 'инструменты' })!.total).toBe(2);
    expect(queryCatalog(snap, null, { q: 'роутеры' })!.entries.map((e) => e.card.id)).toEqual([2]);
  });

  it('те же параметры на том же снимке - тот же ответ без пересчёта', () => {
    const a = queryCatalog(snapshot, 'tools', { brand: 'A', sort: 'price-asc' });
    const b = queryCatalog(snapshot, 'tools', { sort: 'price-asc', brand: 'A' });
    expect(b).not.toBeNull();
    expect(queryCatalog(snapshot, 'tools', { brand: 'A', sort: 'price-asc' })).toBe(a);
    expect(b!.total).toBe(a!.total);
  });

  it('«Показать ещё» - страницы с первой по N одним списком', () => {
    const r = queryCatalog(snapshot, 'tools', { upto: '2' })!;
    expect(r.entries).toHaveLength(40);
    expect(r).toMatchObject({ page: 2, pages: 2, total: 40 });
  });

  it('иерархия: родитель видит позиции подраздела, путь, подразделы, /shop - верхние', () => {
    const drills = { ...tools, slug: 'drills', title: 'Перфораторы', parent: 'tools' };
    const snap = snapshotOf({
      cards: [card(1), card(2, { section: 'drills' }), card(3, { section: 'drills' })],
      sections: [tools, drills],
    });
    expect(queryCatalog(snap, 'tools', {})!.total).toBe(3);
    expect(queryCatalog(snap, 'drills', {})!.total).toBe(2);
    expect(queryCatalog(snap, 'drills', {})!.path.map((s) => s.title)).toEqual([
      'Инструмент',
      'Перфораторы',
    ]);
    expect(queryCatalog(snap, 'tools', {})!.children.map((n) => [n.slug, n.count])).toEqual([
      ['drills', 2],
    ]);
    expect(
      queryCatalog(snap, null, {})!.previews.map((p) => [p.section.slug, p.section.count]),
    ).toEqual([['tools', 3]]);
  });

  it('чужой раздел - нет выдачи', () => {
    expect(queryCatalog(snapshot, 'nope', {})).toBeNull();
  });
});
