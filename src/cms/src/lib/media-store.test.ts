import { describe, expect, it } from 'vitest';

import { copyFiles } from './media-store';
import type { Move } from './media-move';

const url = (key: string) => `https://cdn.site.ru/${key}`;

/** Хранилище в памяти: ключ - содержимое. */
function memoryStore(files: Record<string, string>) {
  const put: Array<{ key: string; contentType: string }> = [];
  return {
    put,
    store: {
      urlForKey: url,
      readSource: async (address: string) => {
        const key = address.replace('https://cdn.site.ru/', '');
        if (!(key in files)) throw new Error(`404 ${address}`);
        return Buffer.from(files[key]!);
      },
      put: async (key: string, file: { contentType: string }) => {
        put.push({ key, contentType: file.contentType });
      },
    },
  };
}

const move = (from: string, to: string): Move => ({
  from,
  to,
  filename: to.split('/').at(-1)!,
  contentType: 'image/webp',
});

describe('копирование при переносе', () => {
  it('кладёт каждый файл на новое место с его типом', async () => {
    const { store, put } = memoryStore({ 'a.webp': '1', 'a-768.webp': '2' });
    await copyFiles(store, [move('a-768.webp', 'x/a-768.webp'), move('a.webp', 'x/a.webp')]);
    expect(put).toEqual([
      { key: 'x/a-768.webp', contentType: 'image/webp' },
      { key: 'x/a.webp', contentType: 'image/webp' },
    ]);
  });

  it('файл, уже лежащий на новом месте, пропускается: повтор оборванного переноса проходит', async () => {
    const { store, put } = memoryStore({ 'x/a.webp': '1', 'a-768.webp': '2' });
    await copyFiles(store, [move('a-768.webp', 'x/a-768.webp'), move('a.webp', 'x/a.webp')]);
    expect(put).toEqual([{ key: 'x/a-768.webp', contentType: 'image/webp' }]);
  });

  it('файла нет ни там, ни там - перенос встаёт, запись не сохраняется', async () => {
    const { store } = memoryStore({});
    await expect(copyFiles(store, [move('a.webp', 'x/a.webp')])).rejects.toThrow('404');
  });
});
