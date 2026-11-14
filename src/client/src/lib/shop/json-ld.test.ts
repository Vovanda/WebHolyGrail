import { describe, expect, it } from 'vitest';

import type { OfferView } from 'contracts';

import { offerJsonLd, offerListJsonLd } from './json-ld';

const offer = (over: Partial<OfferView> = {}): OfferView => ({
  id: 1,
  title: 'Мембрана ПВХ',
  price: { units: 4500, micros: 500000, currency: 'RUB' },
  listPrice: null,
  sku: 'MB-12',
  stock: 4,
  summary: 'Рулон 1,2 мм',
  image: null,
  howToBuy: 'cart',
  deposit: null,
  slug: 'membrana-pvh',
  section: 'membrany',
  specs: {},
  ...over,
});

describe('offerJsonLd', () => {
  it('собирает Product с ценой и наличием из данных позиции', () => {
    const json = offerJsonLd(offer(), {
      path: '/shop/item/membrana-pvh',
      images: ['https://cdn.example/mb-1200.webp'],
    });
    expect(json).toMatchObject({
      '@type': 'Product',
      name: 'Мембрана ПВХ',
      sku: 'MB-12',
      description: 'Рулон 1,2 мм',
      image: ['https://cdn.example/mb-1200.webp'],
      offers: {
        '@type': 'Offer',
        price: '4500.5',
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  it('проданная позиция - OutOfStock', () => {
    const json = offerJsonLd(offer({ stock: 0 }), { path: '/shop/item/membrana-pvh' });
    expect(json['offers']).toMatchObject({ availability: 'https://schema.org/OutOfStock' });
  });

  it('позиция по запросу без цены - без предложения', () => {
    const json = offerJsonLd(offer({ price: null }), { path: '/shop/item/membrana-pvh' });
    expect(json).not.toHaveProperty('offers');
  });
});

describe('offerListJsonLd', () => {
  it('нумерует позиции и пропускает позиции без своей страницы', () => {
    const json = offerListJsonLd({
      name: 'Мембраны',
      items: [
        { title: 'Первая', slug: 'first' },
        { title: 'Без страницы', slug: null },
        { title: 'Вторая', slug: 'second' },
      ],
    });
    expect(json['numberOfItems']).toBe(2);
    expect(json['itemListElement']).toMatchObject([
      { position: 1, name: 'Первая' },
      { position: 2, name: 'Вторая' },
    ]);
  });
});
