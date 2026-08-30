import { describe, expect, it, vi } from 'vitest';

import { resourceAddress } from './resource-address.js';

/** Адрес материала: канал автора и короткий код. */

const store = (doc: Record<string, unknown> | null) =>
  ({
    findByID: vi.fn(async () => {
      if (!doc) throw new Error('нет такого документа');
      return doc;
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const playlist = { kind: 'playlists', id: 7 } as const;
const video = { kind: 'media', id: 69 } as const;

describe('адрес материала', () => {
  it('подборка адресуется каналом автора и своим кодом', async () => {
    const payload = store({ shortCode: 'kurs', author: { channel: 'mentor' } });
    expect(await resourceAddress(payload, playlist)).toEqual({ channel: 'mentor', code: 'kurs' });
  });

  it('у записи канал берётся у того, кто её загрузил', async () => {
    const payload = store({ shortCode: 'urok', uploadedBy: { channel: 'mentor' } });
    expect(await resourceAddress(payload, video)).toEqual({ channel: 'mentor', code: 'urok' });
  });

  it('автор важнее загрузившего, когда есть оба', async () => {
    const payload = store({
      shortCode: 'urok',
      author: { channel: 'mentor' },
      uploadedBy: { channel: 'assistant' },
    });
    expect(await resourceAddress(payload, video)).toMatchObject({ channel: 'mentor' });
  });

  it('без короткого кода адреса нет', async () => {
    // Так бывает у только что залитого: вести на несуществующую страницу хуже,
    // чем остаться на месте.
    const payload = store({ author: { channel: 'mentor' } });
    expect(await resourceAddress(payload, video)).toBeNull();
  });

  it('без канала адреса нет', async () => {
    const payload = store({ shortCode: 'urok' });
    expect(await resourceAddress(payload, video)).toBeNull();
  });

  it('связь глубиной ноль канала не даёт', async () => {
    // Пришёл номер вместо документа - канала в нём нет, вести некуда.
    const payload = store({ shortCode: 'urok', author: 3 });
    expect(await resourceAddress(payload, video)).toBeNull();
  });

  it('материала нет - адреса нет, а не падение', async () => {
    expect(await resourceAddress(store(null), video)).toBeNull();
  });
});
