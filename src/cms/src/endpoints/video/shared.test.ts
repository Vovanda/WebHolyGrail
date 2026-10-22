import { describe, expect, it } from 'vitest';

import { clientKey } from './shared';

const req = (headers: Record<string, string>) => ({ headers: new Headers(headers) });

describe('адрес клиента для счёта попыток', () => {
  it('берёт адрес, который дописал nginx, а не присланный клиентом', () => {
    expect(clientKey(req({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('подставленная голова списка не меняет ключ', () => {
    const a = clientKey(req({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }));
    const b = clientKey(req({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }));
    expect(a).toBe(b);
  });

  it('один адрес в цепочке - он и есть', () => {
    expect(clientKey(req({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('без цепочки - X-Real-IP', () => {
    expect(clientKey(req({ 'x-real-ip': '203.0.113.8' }))).toBe('203.0.113.8');
  });
});
