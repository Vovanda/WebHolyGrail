import { describe, expect, it } from 'vitest';

import { forwardedFor } from './forwarded-for';

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
