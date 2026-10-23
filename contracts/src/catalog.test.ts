import { describe, expect, it } from 'vitest';

import {
  applyFilter,
  cardSpecs,
  cleanCharacteristics,
  editDistance,
  facetsOf,
  pageOf,
  publicSpecs,
  quickFilters,
  readFilter,
  readPage,
  readSort,
  searchItems,
  similarItems,
  sortItems,
  stemWord,
  switchLayout,
  toggleValue,
  type CatalogItem,
  type Characteristic,
  typoBudget,
  withShopCharacteristics,
  writeFilter,
} from './catalog';

const CHARS: Characteristic[] = [
  { key: 'material', title: 'Материал', kind: 'enum', filter: 'checks', group: 'Основные' },
  { key: 'thickness', title: 'Толщина', unit: 'мм', kind: 'number', filter: 'range' },
  { key: 'colour', title: 'Цвет', kind: 'enum', filter: 'hidden' },
];

const item = (id: number, title: string, material: string, thickness: number): CatalogItem => ({
  id,
  title,
  specs: { material, thickness, colour: 'серый' },
});

const ITEMS = [
  item(1, 'Мембрана ПВХ 1,2', 'ПВХ', 1.2),
  item(2, 'Мембрана ПВХ 1,5', 'ПВХ', 1.5),
  item(3, 'Мембрана ТПО 1,5', 'ТПО', 1.5),
  item(4, 'Мембрана ТПО 2,0', 'ТПО', 2),
  item(5, 'Клей контактный', 'ПВХ', 0),
];

describe('состояние фильтра в адресе', () => {
  it('туда и обратно: перечень через запятую, диапазон через две точки', () => {
    const state = readFilter({ material: 'ПВХ,ТПО', thickness: '1.2..2' }, CHARS);
    expect(state).toEqual({
      material: { values: ['ПВХ', 'ТПО'] },
      thickness: { min: 1.2, max: 2 },
    });
    expect(
      readFilter(Object.fromEntries(new URLSearchParams(writeFilter(state, CHARS))), CHARS),
    ).toEqual(state);
  });

  it('чужие и скрытые ключи, пустые и мусорные значения отбрасываются', () => {
    expect(
      readFilter({ colour: 'серый', evil: '1', material: '', thickness: 'abc..' }, CHARS),
    ).toEqual({});
    expect(readFilter({ thickness: '..2' }, CHARS)).toEqual({ thickness: { max: 2 } });
  });

  it('переключение значения добавляет и снимает, пустой выбор уходит из адреса', () => {
    const one = toggleValue({}, 'material', 'ПВХ');
    expect(one).toEqual({ material: { values: ['ПВХ'] } });
    expect(toggleValue(one, 'material', 'ПВХ')).toEqual({});
  });
});

describe('фасеты', () => {
  it('счётчик значения - без условия своей группы, с условиями остальных', () => {
    const state = readFilter({ material: 'ПВХ', thickness: '1..1.6' }, CHARS);
    const material = facetsOf(ITEMS, state, CHARS).find((f) => f.key === 'material');
    expect(material?.view === 'checks' && material.options).toEqual([
      { value: 'ПВХ', count: 2, selected: true },
      { value: 'ТПО', count: 1, selected: false },
    ]);
  });

  it('диапазон: границы среди позиций под остальные условия; скрытое в фильтр не идёт', () => {
    const facets = facetsOf(ITEMS, readFilter({ material: 'ТПО' }, CHARS), CHARS);
    const thickness = facets.find((f) => f.key === 'thickness');
    expect(thickness?.view === 'range' && thickness.bounds).toEqual({ min: 1.5, max: 2 });
    expect(facets.some((f) => f.key === 'colour')).toBe(false);
  });

  it('фильтр по всем условиям сразу', () => {
    const state = readFilter({ material: 'ПВХ', thickness: '1.4..' }, CHARS);
    expect(applyFilter(ITEMS, state, CHARS).map((i) => i.id)).toEqual([2]);
  });
});

describe('поиск', () => {
  it('регистр и ё не мешают, слово ищется по началу', () => {
    expect(searchItems(ITEMS, 'КЛЕЙ').map((i) => i.id)).toEqual([5]);
    expect(
      searchItems(ITEMS, 'мембр тпо')
        .map((i) => i.id)
        .sort(),
    ).toEqual([3, 4]);
  });

  it('не та раскладка: «rktq» находит «клей»', () => {
    expect(switchLayout('rktq')).toBe('клей');
    expect(searchItems(ITEMS, 'rktq').map((i) => i.id)).toEqual([5]);
  });

  it('опечатка прощается по длине слова, как у Meilisearch: 5 и 9 букв', () => {
    expect([typoBudget('клей'), typoBudget('мембрана'), typoBudget('контактный')]).toEqual([
      0, 1, 2,
    ]);
    expect(searchItems(ITEMS, 'мембарна').length).toBe(4);
    expect(searchItems(ITEMS, 'клуй')).toEqual([]);
  });

  it('расстояние считает перестановку соседних букв за одну правку', () => {
    expect(editDistance('мембарна', 'мембрана', 2)).toBe(1);
    expect(editDistance('абв', 'где', 1)).toBe(2);
    expect(editDistance('дрель', 'дрель', 1)).toBe(0);
    expect(editDistance('дрел', 'дрель', 1)).toBe(1);
    const long = 'а'.repeat(80);
    expect(editDistance(long, long + 'б', 2)).toBe(1);
  });

  it('пустой запрос - все позиции', () => {
    expect(searchItems(ITEMS, '  ').length).toBe(5);
  });
});

describe('характеристики раздела из админки', () => {
  it('пропускает строки без ключа, названия и повторы; вид и фильтр по умолчанию', () => {
    expect(
      cleanCharacteristics([
        { key: 'thickness', title: 'Толщина', unit: 'мм', kind: 'number' },
        { key: 'Bad Key', title: 'Плохой ключ' },
        { key: 'material', title: '' },
        { key: 'thickness', title: 'Повтор', kind: 'enum' },
        { key: 'material', title: 'Материал', kind: 'enum', inCard: false },
        { key: 'note', title: 'Заметка', kind: 'странное' },
      ]),
    ).toEqual([
      {
        key: 'thickness',
        title: 'Толщина',
        unit: 'мм',
        kind: 'number',
        group: null,
        filter: 'range',
        inCard: true,
        quick: false,
      },
      {
        key: 'material',
        title: 'Материал',
        unit: null,
        kind: 'enum',
        group: null,
        filter: 'checks',
        inCard: false,
        quick: false,
      },
      {
        key: 'note',
        title: 'Заметка',
        unit: null,
        kind: 'text',
        group: null,
        filter: 'hidden',
        inCard: true,
        quick: false,
      },
    ]);
    expect(cleanCharacteristics(null)).toEqual([]);
  });

  it('строки карточки - по порядку раздела, с единицей, без пустых и скрытых', () => {
    const chars = cleanCharacteristics([
      { key: 'thickness', title: 'Толщина', unit: 'мм', kind: 'number' },
      { key: 'material', title: 'Материал', kind: 'enum' },
      { key: 'secret', title: 'Скрыто', kind: 'text', inCard: false },
      { key: 'reinforced', title: 'Армирование', kind: 'bool' },
    ]);
    expect(
      cardSpecs(chars, { material: 'ПВХ', thickness: 1.5, secret: 'x', reinforced: false }),
    ).toEqual([
      { key: 'thickness', title: 'Толщина', value: '1.5 мм' },
      { key: 'material', title: 'Материал', value: 'ПВХ' },
      { key: 'reinforced', title: 'Армирование', value: 'нет' },
    ]);
  });

  it('наружу - ключи своего раздела, видимые в карточке или фильтре', () => {
    const chars = cleanCharacteristics([
      { key: 'thickness', title: 'Толщина', kind: 'number', inCard: false },
      { key: 'note', title: 'Заметка', kind: 'text', inCard: false },
      { key: 'material', title: 'Материал', kind: 'enum' },
    ]);
    expect(
      publicSpecs(chars, { thickness: 1.5, note: 'закупка 90 ₽', material: 'ПВХ', old: 'x' }),
    ).toEqual({ thickness: 1.5, material: 'ПВХ' });
    expect(publicSpecs([], { material: 'ПВХ' })).toEqual({});
  });
});

describe('похожие позиции', () => {
  const item = (
    id: number,
    section: string,
    price: number | null,
    specs: Record<string, string | number>,
  ) => ({
    id,
    title: `п${id}`,
    section,
    price,
    specs,
  });
  const target = item(1, 'membr', 1000, { material: 'ПВХ', thickness: 1.5 });

  it('тот же раздел, больше совпадений выше, при равенстве - ближе цена', () => {
    const rows = similarItems(target, [
      target,
      item(2, 'membr', 5000, { material: 'ПВХ', thickness: 1.5 }),
      item(3, 'membr', 1100, { material: 'ПВХ', thickness: 2 }),
      item(4, 'membr', 900, { material: 'ТПО', thickness: 2 }),
      item(5, 'other', 1000, { material: 'ПВХ', thickness: 1.5 }),
      item(6, 'membr', null, { material: 'ПВХ', thickness: 1.5 }),
      // Цена 0 - «цена по запросу», в ряд не идёт.
      item(7, 'membr', 0, { material: 'ПВХ', thickness: 1.5 }),
    ]);
    expect(rows.map((r) => r.id)).toEqual([2, 3, 4]);
  });

  it('закончившиеся - в конце ряда', () => {
    const rows = similarItems({ ...target, stock: null }, [
      { ...item(2, 'membr', 1000, { material: 'ПВХ', thickness: 1.5 }), stock: 0 },
      { ...item(3, 'membr', 1000, { material: 'ТПО' }), stock: 5 },
    ]);
    expect(rows.map((r) => r.id)).toEqual([3, 2]);
  });
});

describe('общие характеристики магазина и быстрые фильтры', () => {
  const section = cleanCharacteristics([
    { key: 'brand', title: 'Бренд', kind: 'enum', filter: 'checks', quick: true },
    { key: 'watts', title: 'Мощность', kind: 'number', filter: 'range' },
    { key: 'price', title: 'Своя цена', kind: 'number' },
  ]);
  const chars = withShopCharacteristics(section);
  const items = [
    {
      id: 1,
      title: 'a',
      specs: { brand: 'A', watts: 600, 'in-stock': true, sale: true, price: 100 },
    },
    {
      id: 2,
      title: 'b',
      specs: { brand: 'B', watts: 900, 'in-stock': true, sale: false, price: 200 },
    },
    {
      id: 3,
      title: 'c',
      specs: { brand: 'A', watts: 1200, 'in-stock': false, sale: false, price: 300 },
    },
  ];

  it('ключ общей характеристики у раздела занят', () => {
    expect(section.map((c) => c.key)).toEqual(['brand', 'watts']);
  });

  it('да/нет - один переключатель с названием, перечень - по значению', () => {
    const quick = quickFilters(facetsOf(items, {}, chars), chars);
    expect(quick.map((q) => q.label)).toEqual(['В наличии', 'Со скидкой', 'A', 'B']);
    expect(quick.find((q) => q.label === 'В наличии')).toMatchObject({ value: 'да', count: 2 });
  });

  it('выбор в строке - тот же адрес, что галочка в панели', () => {
    const state = readFilter({ 'in-stock': 'да', brand: 'A' }, chars);
    expect(applyFilter(items, state, chars).map((i) => i.id)).toEqual([1]);
    const quick = quickFilters(facetsOf(items, state, chars), chars);
    expect(quick.filter((q) => q.selected).map((q) => q.label)).toEqual(['В наличии', 'A']);
  });

  it('значение, ведущее в пустую выдачу, в строку не идёт', () => {
    const state = readFilter({ brand: 'B' }, chars);
    const quick = quickFilters(facetsOf(items, state, chars), chars);
    expect(quick.find((q) => q.label === 'Со скидкой')).toBeUndefined();
  });
});

describe('сортировка и страницы выдачи', () => {
  const items = [
    { id: 1, price: 300, discount: 0, created: '2026-01-03' },
    { id: 2, price: null, discount: 0, created: '2026-01-01' },
    { id: 3, price: 100, discount: 20, created: '2026-01-02' },
    { id: 4, price: 200, discount: 5, created: '2026-01-04' },
  ];
  const keys = {
    price: (i: (typeof items)[number]) => i.price,
    discount: (i: (typeof items)[number]) => i.discount,
    created: (i: (typeof items)[number]) => i.created,
  };
  const ids = (sort: Parameters<typeof sortItems>[1]) =>
    sortItems(items, sort, keys).map((i) => i.id);

  it('по умолчанию - порядок входа', () => expect(ids('default')).toEqual([1, 2, 3, 4]));
  it('без цены - в конце в обе стороны', () => {
    expect(ids('price-asc')).toEqual([3, 4, 1, 2]);
    expect(ids('price-desc')).toEqual([1, 4, 3, 2]);
  });
  it('по скидке и новинки', () => {
    expect(ids('discount')).toEqual([3, 4, 1, 2]);
    expect(ids('new')).toEqual([4, 1, 3, 2]);
  });
  it('порядок и страница из адреса терпят мусор', () => {
    expect(readSort('price-asc')).toBe('price-asc');
    expect(readSort('drop table')).toBe('default');
    expect(readPage('3')).toBe(3);
    expect(readPage('-1')).toBe(1);
    expect(readPage('2.5')).toBe(1);
  });
  it('страница за последней прижимается к последней', () => {
    const list = Array.from({ length: 65 }, (_, i) => i);
    expect(pageOf(list, 1)).toMatchObject({ page: 1, pages: 3, total: 65 });
    expect(pageOf(list, 9).items).toEqual([60, 61, 62, 63, 64]);
    expect(pageOf([], 1)).toMatchObject({ items: [], page: 1, pages: 1, total: 0 });
  });
});

describe('поиск по артикулу', () => {
  const items = [
    { id: 1, title: 'Перфоратор', sku: 'TT-1000', specs: {} },
    { id: 2, title: 'Дрель', sku: 'TT-2000', specs: {} },
  ];
  it('находит как написан, слитно и частями', () => {
    for (const q of ['TT-1000', 'tt1000', 'TT 1000', '1000']) {
      expect(searchItems(items, q).map((i) => i.id)).toEqual([1]);
    }
  });
  it('опечатка в названии и другая раскладка', () => {
    expect(searchItems(items, 'перфаратор').map((i) => i.id)).toEqual([1]);
    expect(searchItems(items, 'lhtkm').map((i) => i.id)).toEqual([2]);
  });
});

describe('поиск без ручной разметки: окончания, раздел, характеристики', () => {
  const items = [
    { id: 1, title: 'Перфоратор сетевой', specs: {} },
    { id: 2, title: 'Дрель-шуруповёрт аккумуляторная', specs: {} },
    { id: 3, title: 'Дрель ударная', specs: {} },
  ];
  const ids = (q: string) => searchItems(items, q).map((i) => i.id);

  it('множественное число и падеж находят единственное', () => {
    expect(ids('перфораторы')).toEqual([1]);
    expect(ids('дрели')).toEqual([2, 3]);
    expect(ids('аккумуляторный')).toEqual([2]);
  });

  it('раздел и характеристики находят то, чего нет в названии', () => {
    const more = [
      ...items,
      {
        id: 4,
        title: 'Модель X-200',
        sectionTitle: 'Перфораторы',
        specs: { power: 'аккумулятор' },
      },
    ];
    expect(searchItems(more, 'аккумуляторный перфоратор').map((i) => i.id)).toEqual([4]);
  });

  it('другое название от продавца: роутер находит маршрутизатор', () => {
    const more = [
      ...items,
      { id: 5, title: 'Маршрутизатор Wi-Fi 6', keywords: 'роутер', specs: {} },
    ];
    expect(searchItems(more, 'роутеры').map((i) => i.id)).toEqual([5]);
  });

  it('основа не режет короткие слова и коды', () => {
    expect(stemWord('дрель')).toBe('дрель');
    expect(stemWord('tt1000')).toBe('tt1000');
    expect(stemWord('перфораторы')).toBe('перфоратор');
  });
});
