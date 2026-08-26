import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { isWrapped, masterKey, unwrapSecret, wrapSecret } from './key-vault.js';

const key = randomBytes(32);
const other = randomBytes(32);
const secret = randomBytes(16);

describe('хранение секрета потока', () => {
  it('развёрнутый секрет совпадает с исходным', () => {
    expect(unwrapSecret(wrapSecret(secret, key), key)).toEqual(secret);
  });

  it('в базе не остаётся исходного секрета', () => {
    // Иначе утёкший дамп отдал бы ключи от всего закрытого.
    expect(wrapSecret(secret, key)).not.toContain(secret.toString('base64'));
  });

  it('каждое заворачивание даёт разный вид', () => {
    // Повтор вектора с тем же ключом раскрывает содержимое.
    expect(wrapSecret(secret, key)).not.toBe(wrapSecret(secret, key));
  });

  it('чужим ключом не разворачивается', () => {
    expect(() => unwrapSecret(wrapSecret(secret, key), other)).toThrow();
  });

  it('подменённое в базе значение не проходит', () => {
    // Метка подлинности: иначе подделка развернулась бы в мусор и молча
    // уехала в плеер.
    const wrapped = wrapSecret(secret, key);
    const [iv, sealed, tag] = wrapped.split('.') as [string, string, string];
    const broken = [iv, `${sealed.slice(0, -2)}AA`, tag].join('.');
    expect(() => unwrapSecret(broken, key)).toThrow();
  });

  it('старый открытый секрет читается как есть', () => {
    // Включение мастер-ключа не должно обрушить уже залитые ролики.
    expect(unwrapSecret(secret.toString('base64'), key)).toEqual(secret);
  });

  it('без мастер-ключа секрет хранится как раньше', () => {
    const stored = wrapSecret(secret, null);
    expect(stored).toBe(secret.toString('base64'));
    expect(unwrapSecret(stored, null)).toEqual(secret);
  });

  it('завёрнутый секрет без ключа не развернуть', () => {
    expect(() => unwrapSecret(wrapSecret(secret, key), null)).toThrow(/VIDEO_MASTER_KEY/);
  });

  it('завёрнутое отличается от открытого', () => {
    expect(isWrapped(wrapSecret(secret, key))).toBe(true);
    expect(isWrapped(secret.toString('base64'))).toBe(false);
  });

  it('ключ неверной длины отвергается', () => {
    // Короткий ключ хуже отсутствующего: он создаёт видимость защиты.
    expect(() => masterKey({ VIDEO_MASTER_KEY: 'c2hvcnQ=' })).toThrow(/32 байт/);
  });

  it('без переменной ключа нет', () => {
    expect(masterKey({})).toBeNull();
  });
});
