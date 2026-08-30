import { describe, expect, it } from 'vitest';

import { accessTarget } from './resource-field';

/**
 * Ошибка здесь тихая и дорогая: в право уедет объект вместо номера, и найти
 * выданное потом будет нечем.
 */

describe('на что открыт доступ', () => {
  it('читает номер, пришедший числом', () => {
    expect(accessTarget({ relationTo: 'playlists', value: 7 })).toEqual({
      kind: 'playlists',
      id: 7,
    });
  });

  it('читает номер, пришедший записью целиком', () => {
    // Так поле выглядит при глубоком чтении: связь развёрнута в документ.
    expect(accessTarget({ relationTo: 'media', value: { id: 42, title: 'Запись' } })).toEqual({
      kind: 'media',
      id: 42,
    });
  });

  it('принимает строковый номер', () => {
    expect(accessTarget({ relationTo: 'media', value: 'abc123' })).toEqual({
      kind: 'media',
      id: 'abc123',
    });
  });

  it('не выдумывает право там, где связи нет', () => {
    expect(accessTarget(null)).toBeNull();
    expect(accessTarget(undefined)).toBeNull();
    expect(accessTarget({})).toBeNull();
    expect(accessTarget({ relationTo: 'playlists' })).toBeNull();
  });

  it('пустой номер - это отсутствие номера', () => {
    expect(accessTarget({ relationTo: 'playlists', value: '' })).toBeNull();
    expect(accessTarget({ relationTo: 'playlists', value: '   ' })).toBeNull();
    expect(accessTarget({ relationTo: 'media', value: null })).toBeNull();
    expect(accessTarget({ relationTo: 'media', value: { title: 'без номера' } })).toBeNull();
  });

  it('чужой вид связи правом не становится', () => {
    // Иначе код на статью открыл бы запись с тем же номером.
    expect(accessTarget({ relationTo: 'articles', value: 7 })).toBeNull();
    expect(accessTarget({ relationTo: 'users', value: 1 })).toBeNull();
  });
});
