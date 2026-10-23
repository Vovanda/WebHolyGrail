import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dropSnapshot, readSnapshots, writeSnapshots } from './snapshots';

let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('снимки показанного', () => {
  it('дописываются поверх прежних и удаляются по одному', () => {
    writeSnapshots('k', { '1': 'a', '2': 'b' });
    writeSnapshots('k', { '2': 'B' });
    expect(readSnapshots('k')).toEqual({ '1': 'a', '2': 'B' });
    dropSnapshot('k', '1');
    expect(readSnapshots('k')).toEqual({ '2': 'B' });
  });

  it('держат не больше сотни', () => {
    writeSnapshots('k', Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`x${i}`, i])));
    expect(Object.keys(readSnapshots('k'))).toHaveLength(100);
  });

  it('битое или чужое содержимое читается пустым, недоступное хранилище не роняет', () => {
    store.set('k', '[1,2]');
    expect(readSnapshots('k')).toEqual({});
    store.set('k', '{не json');
    expect(readSnapshots('k')).toEqual({});
    vi.stubGlobal('window', {});
    expect(readSnapshots('k')).toEqual({});
    expect(() => writeSnapshots('k', { a: 1 })).not.toThrow();
  });
});
