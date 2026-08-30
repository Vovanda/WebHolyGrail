import { describe, expect, it } from 'vitest';

import { tokenFromCookieHeader } from './viewer-cookie.js';

const TOKEN = '4uFd5E4m3hdC-xMuL2RINQ.1788651485.vM3F85Rz-YKf8-8C.6sFBHF67H2nwM5DL75faIS681HO';

describe('токен зрителя из заголовка кук', () => {
  it('читается, когда кука единственная', () => {
    expect(tokenFromCookieHeader(`whg-viewer=${TOKEN}`)).toBe(TOKEN);
  });

  it('читается, когда перед ней стоят чужие куки', () => {
    // Ровно этот случай и ломался: браузер ставит свои куки раньше нашей,
    // и идентичность переставало находиться прямо в браузере, хотя curl с одной
    // кукой работал.
    const raw = `__next_hmr_refresh_hash__=816; other=1; whg-viewer=${TOKEN}`;
    expect(tokenFromCookieHeader(raw)).toBe(TOKEN);
  });

  it('читается и без пробела после точки с запятой', () => {
    expect(tokenFromCookieHeader(`a=1;whg-viewer=${TOKEN}`)).toBe(TOKEN);
  });

  it('не путается с кукой, чьё имя начинается так же', () => {
    expect(tokenFromCookieHeader(`whg-viewer-old=чужое; whg-viewer=${TOKEN}`)).toBe(TOKEN);
  });

  it('пустой заголовок и отсутствие куки дают ничего', () => {
    expect(tokenFromCookieHeader('')).toBeNull();
    expect(tokenFromCookieHeader('a=1; b=2')).toBeNull();
    expect(tokenFromCookieHeader('whg-viewer=')).toBeNull();
  });
});
