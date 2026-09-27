import type { BlockNode, MediaDoc } from 'contracts';
import { describe, expect, it } from 'vitest';

import { pageShareImage } from './share-image';

const img = (id: number, mimeType = 'image/webp'): MediaDoc =>
  ({ id, url: `/media/${id}.webp`, mimeType }) as MediaDoc;
const block = (data: unknown): BlockNode => ({ blockType: 'x', id: 'b', data }) as BlockNode;
const flat = (fields: object): BlockNode =>
  ({ blockType: 'x', id: 'b', ...fields }) as unknown as BlockNode;

describe('картинка превью страницы', () => {
  it('своя картинка страницы главнее всего', () => {
    expect(pageShareImage(img(1), [block({ photo: img(2) })], img(3))?.id).toBe(1);
  });

  it('без своей - первая картинка в блоках по порядку показа', () => {
    const blocks = [
      block({ title: 'Текст' }),
      block({ items: [{ images: [{ image: img(5) }] }] }),
      block({ photo: img(6) }),
    ];
    expect(pageShareImage(null, blocks, img(3))?.id).toBe(5);
  });

  it('вектор пропускается: мессенджеры его не показывают', () => {
    expect(
      pageShareImage(img(1, 'image/svg+xml'), [block({ preview: img(2, 'image/svg+xml') })], img(3))
        ?.id,
    ).toBe(3);
  });

  it('поля блока прямо в узле, без data', () => {
    expect(pageShareImage(null, [flat({ photo: img(8) })], null)?.id).toBe(8);
  });

  it('ссылка на картинку без документа (номер) не считается картинкой', () => {
    expect(pageShareImage(null, [block({ photo: 7 })], null)).toBeNull();
  });
});
