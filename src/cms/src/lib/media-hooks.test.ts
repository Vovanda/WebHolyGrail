import { describe, expect, it } from 'vitest';

import { issueShortCode, stampUploader, syncPreviewUrl, syncTitle } from './media-hooks';

/** Хук получает только то, что читает; остальное Payload в них не трогается. */
type Args = {
  data: Record<string, unknown>;
  operation?: 'create' | 'update';
  req?: { user?: { id: number } | null };
};
const run = async (
  hook: (args: never) => unknown,
  { data, operation = 'create', req = {} }: Args,
): Promise<Record<string, unknown>> =>
  (await hook({ data, operation, req } as never)) as Record<string, unknown>;

describe('автор файла', () => {
  it('при заливке автором становится вошедший', async () => {
    const got = await run(stampUploader, { data: {}, req: { user: { id: 5 } } });
    expect(got['uploadedBy']).toBe(5);
  });

  it('указанного автора заливка не перебивает', async () => {
    const got = await run(stampUploader, { data: { uploadedBy: 9 }, req: { user: { id: 5 } } });
    expect(got['uploadedBy']).toBe(9);
  });

  it('правка чужой записи автора не меняет', async () => {
    const got = await run(stampUploader, {
      data: {},
      operation: 'update',
      req: { user: { id: 5 } },
    });
    expect(got).not.toHaveProperty('uploadedBy');
  });
});

describe('код адреса видео', () => {
  it('новое видео получает код', async () => {
    const got = await run(issueShortCode, { data: { mimeType: 'video/mp4' } });
    expect(got['shortCode']).toEqual(expect.any(String));
  });

  it('картинке код не нужен', async () => {
    const got = await run(issueShortCode, { data: { mimeType: 'image/webp' } });
    expect(got).not.toHaveProperty('shortCode');
  });

  it('выданный код не меняется при правке', async () => {
    const got = await run(issueShortCode, {
      data: { mimeType: 'video/mp4', shortCode: 'abc123' },
      operation: 'update',
    });
    expect(got['shortCode']).toBe('abc123');
  });
});

describe('адрес кадра рядом с записью', () => {
  it('развёрнутый кадр переписывает адрес', async () => {
    const got = await run(syncPreviewUrl, {
      data: { preview: { url: '/new.webp' }, previewUrl: '/old.webp' },
    });
    expect(got['previewUrl']).toBe('/new.webp');
  });

  it('кадр номером адрес не трогает', async () => {
    const got = await run(syncPreviewUrl, { data: { preview: 3, previewUrl: '/old.webp' } });
    expect(got['previewUrl']).toBe('/old.webp');
  });
});

describe('имя документа', () => {
  it('название главнее имени файла', async () => {
    const got = await run(syncTitle, { data: { caption: ' Урок 4 ', filename: 'lesson-4.mp4' } });
    expect(got['title']).toBe('Урок 4');
  });

  it('без названия - имя файла', async () => {
    const got = await run(syncTitle, { data: { caption: '', filename: 'lesson-4.mp4' } });
    expect(got['title']).toBe('lesson-4.mp4');
  });
});
