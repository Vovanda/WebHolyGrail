import { describe, expect, it } from 'vitest';

import { fromAdmin } from './from-admin';

const req = (url: string, referer: string | null = null) => ({
  url,
  headers: { get: (name: string) => (name === 'referer' ? referer : null) },
  payload: { config: { routes: { admin: '/admin' } } },
});

describe('запрос из админки', () => {
  it('страница админки и отправка формы с её страницы - из админки', () => {
    expect(fromAdmin(req('https://site.ru/admin/collections/form-submissions'))).toBe(true);
    expect(
      fromAdmin(req('/api/form-submissions', 'https://site.ru/admin/collections/x/create')),
    ).toBe(true);
  });

  it('форма на странице сайта - не из админки, хоть домен и тот же', () => {
    expect(fromAdmin(req('/api/form-submissions', 'https://site.ru/contacts'))).toBe(false);
    expect(fromAdmin(req('/api/form-submissions', 'https://site.ru/administration'))).toBe(false);
    expect(fromAdmin(req('/api/form-submissions'))).toBe(false);
  });
});
