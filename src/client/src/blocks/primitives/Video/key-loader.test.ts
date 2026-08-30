import { describe, expect, it } from 'vitest';

import { isKeyRequest } from './key-loader';

/**
 * Загрузчик узнаёт запрос ключа по адресу и только его берёт на себя. Ошибка
 * здесь тихая: ключ уходит мимо перехвата, запись играет как ни в чём не бывало,
 * а зритель без права видит мёртвый кадр вместо формы кода.
 */

const SITE = 'https://site.example';

describe('запрос ключа', () => {
  it('узнаётся по двери сайта', () => {
    expect(isKeyRequest(`${SITE}/internal/video/key/87?p=3`)).toBe(true);
  });

  it('узнаётся и без номера криптопериода', () => {
    // Нарезанное до появления криптопериодов отдаёт единственный ключ.
    expect(isKeyRequest(`${SITE}/internal/video/key/12`)).toBe(true);
  });

  it('узнаётся, когда адрес пришёл без домена', () => {
    // В манифесте стоит путь от корня, и загрузчик может увидеть его как есть.
    expect(isKeyRequest('/internal/video/key/87?p=0')).toBe(true);
  });

  it('сегменты и плейлисты берёт не он', () => {
    expect(isKeyRequest('https://cdn.example/media/u1/hls/abc/480p/seg-001.ts')).toBe(false);
    expect(isKeyRequest(`${SITE}/internal/video/manifest/87/480p.m3u8`)).toBe(false);
  });

  it('дверь без номера записи - не запрос ключа', () => {
    // Так выглядел бы адрес, собранный с потерянным номером: идти по нему некуда.
    expect(isKeyRequest(`${SITE}/internal/video/key/`)).toBe(false);
  });
});
