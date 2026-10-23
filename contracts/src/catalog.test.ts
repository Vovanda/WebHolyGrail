import { describe, expect, it } from 'vitest';

import {
  cardSpecs,
  cleanCharacteristics,
  applyFilter,
  type CatalogItem,
  type Characteristic,
  editDistance,
  facetsOf,
  publicSpecs,
  similarItems,
  readFilter,
  searchItems,
  switchLayout,
  toggleValue,
  typoBudget,
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
      },
      {
        key: 'material',
        title: 'Материал',
        unit: null,
        kind: 'enum',
        group: null,
        filter: 'checks',
        inCard: false,
      },
      {
        key: 'note',
        title: 'Заметка',
        unit: null,
        kind: 'text',
        group: null,
        filter: 'hidden',
        inCard: true,
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
