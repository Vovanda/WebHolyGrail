import { describe, expect, it } from 'vitest';

import { canReadApiKey } from './api-key-access';

describe('кто видит ключ API учётки', () => {
  it('владелец видит свой', () => {
    expect(canReadApiKey({ id: 3, role: 'editor' }, 3)).toBe(true);
  });

  it('редактор не видит чужой', () => {
    expect(canReadApiKey({ id: 3, role: 'editor' }, 1)).toBe(false);
  });

  it('администратор видит любой', () => {
    expect(canReadApiKey({ id: 2, role: 'admin' }, 1)).toBe(true);
  });

  it('без входа не видит никто', () => {
    expect(canReadApiKey(null, 1)).toBe(false);
    expect(canReadApiKey(undefined, 1)).toBe(false);
  });

  it('номер строкой и числом - одна учётка', () => {
    expect(canReadApiKey({ id: '3', role: 'editor' }, 3)).toBe(true);
  });

  it('без номера учётки не-админ не видит ничего', () => {
    expect(canReadApiKey({ id: 3, role: 'editor' }, undefined)).toBe(false);
  });
});
