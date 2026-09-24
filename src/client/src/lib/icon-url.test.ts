import { describe, expect, it } from 'vitest';

import { darkThemeIconUrl } from './icon-url';

describe('значок бренда для тёмной темы', () => {
  it('чёрный знак получает светлый вариант', () => {
    expect(darkThemeIconUrl('https://cdn.simpleicons.org/nextdotjs/000000')).toBe(
      'https://cdn.simpleicons.org/nextdotjs/e5e5e5',
    );
  });

  it('тёмно-синий тоже - на тёмной теме он теряется', () => {
    expect(darkThemeIconUrl('https://cdn.simpleicons.org/sqlite/003B57')).toBe(
      'https://cdn.simpleicons.org/sqlite/e5e5e5',
    );
  });

  it('цветной знак остаётся как есть', () => {
    expect(darkThemeIconUrl('https://cdn.simpleicons.org/react/61DAFB')).toBeNull();
    expect(darkThemeIconUrl('https://cdn.simpleicons.org/docker/2496ED')).toBeNull();
  });

  it('второй цвет в адресе заменяется одним светлым', () => {
    expect(darkThemeIconUrl('https://cdn.simpleicons.org/payloadcms/000000/ffffff')).toBe(
      'https://cdn.simpleicons.org/payloadcms/e5e5e5',
    );
  });

  it('чужой адрес и адрес без цвета не трогаются', () => {
    expect(darkThemeIconUrl('https://example.com/logo.svg')).toBeNull();
    expect(darkThemeIconUrl('https://cdn.simpleicons.org/nextdotjs')).toBeNull();
  });
});
