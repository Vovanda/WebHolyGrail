import { describe, expect, it } from 'vitest';

import { attachmentBlock } from './attachment-block';

describe('блок для вложенного файла', () => {
  it('снимок встаёт галереей из одного кадра', () => {
    expect(attachmentBlock({ id: 7, mimeType: 'image/webp' })).toEqual({
      blockName: '',
      blockType: 'gallery',
      files: [7],
      view: 'list',
    });
  });

  it('запись встаёт блоком видео', () => {
    expect(attachmentBlock({ id: 8, mimeType: 'video/mp4' })).toEqual({
      blockName: '',
      blockType: 'video',
      video: 8,
    });
  });

  it('документ встаёт строкой документов без заголовка раздела', () => {
    expect(attachmentBlock({ id: 9, mimeType: 'application/pdf' })).toEqual({
      blockName: '',
      blockType: 'document-list',
      heading: '',
      items: [{ file: 9 }],
      layout: 'list',
    });
  });

  it('файл без типа считается документом, а не картинкой', () => {
    expect(attachmentBlock({ id: 10 }).blockType).toBe('document-list');
    expect(attachmentBlock({ id: 11, mimeType: null }).blockType).toBe('document-list');
  });
});
