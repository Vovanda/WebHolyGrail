import { describe, expect, it } from 'vitest';

import { cardFromDoc, detailFromDoc } from './payload-store';

const section = {
  id: 1,
  slug: 'courses',
  title: 'Курсы',
  characteristics: [
    { key: 'hours', title: 'Часы', kind: 'number' },
    { key: 'cost', title: 'Закупка', kind: 'number', inCard: false, filter: 'hidden' },
    { key: 'format', title: 'Формат', kind: 'enum', inCard: false },
  ],
};

const doc = {
  id: 5,
  title: 'Курс «Сила»',
  priceMicros: 4_500_000_000,
  stock: null,
  slug: 'sila',
  section,
  specs: { hours: 40, cost: 900, format: 'онлайн', old: 'от прежнего раздела', bad: { x: 1 } },
  description: { root: { children: [] } },
  gallery: [{ id: 3 }, null, 'кривое'],
};

describe('позиция из документа Payload', () => {
  it('наружу только характеристики своего раздела, видимые в карточке или фильтре', () => {
    const card = cardFromDoc(doc);
    expect(card.specs).toEqual({ hours: 40, format: 'онлайн' });
    expect(card.section).toBe('courses');
  });

  it('артикул без пробелов по краям, пустой - нет артикула', () => {
    expect(cardFromDoc({ ...doc, sku: ' A-17 ' }).sku).toBe('A-17');
    expect(cardFromDoc({ ...doc, sku: '  ' }).sku).toBeNull();
    expect(cardFromDoc(doc).sku).toBeNull();
  });

  it('без прочитанного раздела характеристик наружу нет', () => {
    expect(cardFromDoc({ ...doc, section: 1 }).specs).toEqual({});
    expect(cardFromDoc({ ...doc, section: 1 }).section).toBeNull();
  });

  it('страница позиции - раздел, его характеристики и галерея без мусора', () => {
    const detail = detailFromDoc(doc);
    expect(detail.sectionTitle).toBe('Курсы');
    expect(detail.characteristics.map((c) => c.key)).toEqual(['hours', 'format']);
    expect(detail.gallery).toEqual([{ id: 3 }]);
    expect(detail.specs).not.toHaveProperty('cost');
  });
});
