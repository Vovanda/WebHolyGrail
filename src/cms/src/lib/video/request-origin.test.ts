import { describe, expect, it } from 'vitest';

import { checkRequestOrigin } from './request-origin.js';

/**
 * Ключ выдаётся плееру на нашем сайте. Чужая страница, встроившая поток,
 * получает отказ - иначе платный курс крутится на стороннем сайте под чужой
 * рекламой.
 */

const ALLOWED = ['https://whg.example', 'http://localhost:3000'];

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe('источник запроса за ключом', () => {
  it('свой домен пропускается', () => {
    const check = checkRequestOrigin(headers({ origin: 'https://whg.example' }), ALLOWED);
    expect(check.allowed).toBe(true);
  });

  it('чужой домен получает отказ', () => {
    const check = checkRequestOrigin(headers({ origin: 'https://pirate.example' }), ALLOWED);
    expect(check.allowed).toBe(false);
    expect(check.origin).toBe('https://pirate.example');
  });

  it('схема и порт значения не имеют: за прокси они до нас не доходят', () => {
    expect(
      checkRequestOrigin(headers({ origin: 'http://whg.example:8443' }), ALLOWED).allowed,
    ).toBe(true);
  });

  it('когда пометки о происхождении нет, запрос проходит', () => {
    expect(checkRequestOrigin(headers({}), ALLOWED).allowed).toBe(true);
    expect(checkRequestOrigin(undefined, ALLOWED).allowed).toBe(true);
  });

  it('адрес страницы годится, когда отдельной пометки нет', () => {
    const own = checkRequestOrigin(headers({ referer: 'https://whg.example/video/1' }), ALLOWED);
    expect(own.allowed).toBe(true);

    const foreign = checkRequestOrigin(
      headers({ referer: 'https://pirate.example/steal' }),
      ALLOWED,
    );
    expect(foreign.allowed).toBe(false);
  });

  it('испорченное значение просмотр не ломает', () => {
    expect(checkRequestOrigin(headers({ origin: 'мусор' }), ALLOWED).allowed).toBe(true);
  });
});
