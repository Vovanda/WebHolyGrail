import type { CollectionConfig } from 'payload';

import { editorsOnly } from '../lib/access/editors';

/**
 * Запросы поиска по магазину, которые ничего не нашли (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Пишет поиск сам, продавец только читает и удаляет: увидел «болгарка - 12 раз» -
 * дописал слово в «Другие названия» нужной позиции. Одна запись на запрос, счёт
 * растёт с каждым повтором; запрос хранится приведённым (нижний регистр, ё → е).
 */
export const SearchMisses: CollectionConfig = {
  slug: 'search-misses',
  labels: { singular: 'Не нашлось в поиске', plural: 'Не нашлось в поиске' },
  admin: {
    useAsTitle: 'query',
    defaultColumns: ['query', 'count', 'lastAt'],
    group: 'Магазин',
    description: 'Что покупатели искали и не нашли. Допишите слово в «Другие названия» позиции.',
  },
  defaultSort: '-count',
  access: { read: editorsOnly, create: () => false, update: () => false, delete: editorsOnly },
  fields: [
    { name: 'query', label: 'Запрос', type: 'text', required: true, unique: true, index: true },
    { name: 'count', label: 'Сколько раз', type: 'number', required: true, defaultValue: 1 },
    {
      name: 'lastAt',
      label: 'Последний раз',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
};
