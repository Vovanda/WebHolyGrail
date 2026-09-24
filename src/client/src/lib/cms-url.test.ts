import { describe, expect, it } from 'vitest';

import { CMS_URL, absoluteUrl } from './cms-url';

describe('адрес файла CMS', () => {
  it('полный адрес раздачи не трогается', () => {
    expect(absoluteUrl('https://cdn.example/a.webp')).toBe('https://cdn.example/a.webp');
  });

  it('путь от корня клеится к адресу CMS', () => {
    expect(absoluteUrl('/api/media/file/a.webp')).toBe(`${CMS_URL}/api/media/file/a.webp`);
  });

  it('путь без косой черты получает её', () => {
    expect(absoluteUrl('media/a.webp')).toBe(`${CMS_URL}/media/a.webp`);
  });

  it('адрес CMS без косой черты в конце', () => {
    expect(CMS_URL.endsWith('/')).toBe(false);
  });
});
