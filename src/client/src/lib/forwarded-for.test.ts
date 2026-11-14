import { describe, expect, it } from 'vitest';

import { forwardedFor, visitorIp } from './forwarded-for';

describe('пересылка адреса клиента в CMS', () => {
  it('цепочка уходит как получена', () => {
    const request = new Request('http://site/internal/video/redeem', {
      headers: { 'x-forwarded-for': '1.1.1.1, 203.0.113.7' },
    });
    expect(forwardedFor(request)).toEqual({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' });
  });

  it('без заголовка - ничего', () => {
    expect(forwardedFor(new Request('http://site/'))).toEqual({});
  });
});

describe('адрес посетителя', () => {
  const req = (headers: Record<string, string>) => new Request('http://site/', { headers });

  it('последний в цепочке - его дописал nginx', () => {
    expect(visitorIp(req({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('не IP - нет адреса', () => {
    expect(visitorIp(req({ 'x-forwarded-for': '1.1.1.1/../x' }))).toBeNull();
    expect(visitorIp(req({ 'x-real-ip': 'evil.example' }))).toBeNull();
  });

  it('без заголовков - нет адреса', () => {
    expect(visitorIp(req({}))).toBeNull();
  });
});
