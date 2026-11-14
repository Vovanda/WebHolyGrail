import { beforeEach, describe, expect, it } from 'vitest';

import { type Execute, returnStock, takeStock } from './stock';

/**
 * Условное списание на настоящем SQLite: SQL проверяется базой, а не моделью.
 * Встроенный `node:sqlite` берётся мимо сборщика тестов: Vite его не знает.
 */
const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');
let db: InstanceType<typeof DatabaseSync>;
let execute: Execute;
const stockOf = (id: number) =>
  (db.prepare('SELECT stock FROM offers WHERE id = ?').get(id) as { stock: number | null }).stock;

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE offers (id INTEGER PRIMARY KEY, stock NUMERIC)');
  db.exec('INSERT INTO offers (id, stock) VALUES (1, 1), (2, NULL), (3, 5)');
  execute = async (sql, args) => Number(db.prepare(sql).run(...args).changes);
});

describe('списание остатка', () => {
  it('штучная позиция списывается один раз: второй покупатель получает отказ', async () => {
    expect(await takeStock(execute, [{ offer: 1, quantity: 1 }])).toEqual({ ok: true });
    expect(await takeStock(execute, [{ offer: 1, quantity: 1 }])).toEqual({ ok: false, offer: 1 });
    expect(stockOf(1)).toBe(0);
  });

  it('две покупки одновременно - продаётся одна', async () => {
    const both = await Promise.all([
      takeStock(execute, [{ offer: 1, quantity: 1 }]),
      takeStock(execute, [{ offer: 1, quantity: 1 }]),
    ]);
    expect(both.filter((r) => r.ok)).toHaveLength(1);
    expect(stockOf(1)).toBe(0);
  });

  it('без ограничений - списание проходит и остаток пустой', async () => {
    expect(await takeStock(execute, [{ offer: 2, quantity: 900 }])).toEqual({ ok: true });
    expect(stockOf(2)).toBeNull();
  });

  it('не хватило на одной строке - уже списанное возвращается', async () => {
    expect(
      await takeStock(execute, [
        { offer: 3, quantity: 2 },
        { offer: 1, quantity: 5 },
      ]),
    ).toEqual({ ok: false, offer: 1 });
    expect(stockOf(3)).toBe(5);
    expect(stockOf(1)).toBe(1);
  });

  it('удалённая позиция - отказ', async () => {
    expect(await takeStock(execute, [{ offer: 99, quantity: 1 }])).toEqual({
      ok: false,
      offer: 99,
    });
  });

  it('возврат увеличивает ограниченный остаток и не трогает пустой', async () => {
    await returnStock(execute, [
      { offer: 1, quantity: 1 },
      { offer: 2, quantity: 3 },
    ]);
    expect(stockOf(1)).toBe(2);
    expect(stockOf(2)).toBeNull();
  });
});
