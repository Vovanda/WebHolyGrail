import { describe, expect, it } from 'vitest';

import {
  previewScrollMessage,
  readPreviewScroll,
  scrollRatio,
  scrollTopFor,
} from './preview-scroll';

describe('прокрутка предпросмотра', () => {
  it('форма на середине - доля половина', () => {
    expect(scrollRatio(500, 2000, 1000)).toBe(0.5);
  });

  it('края совпадают: начало и конец', () => {
    expect(scrollRatio(0, 2000, 1000)).toBe(0);
    expect(scrollRatio(1000, 2000, 1000)).toBe(1);
    expect(scrollTopFor(1, 5000, 900)).toBe(4100);
  });

  it('страница другой длины встаёт на ту же долю', () => {
    expect(scrollTopFor(0.5, 5000, 900)).toBe(2050);
  });

  it('короткая страница без прокрутки стоит в начале', () => {
    expect(scrollRatio(0, 800, 1000)).toBe(0);
    expect(scrollTopFor(0.7, 800, 1000)).toBe(0);
  });

  it('сообщение читается обратно, доля зажата в 0..1', () => {
    expect(readPreviewScroll(previewScrollMessage(0.3))).toBe(0.3);
    expect(readPreviewScroll(previewScrollMessage(1.4))).toBe(1);
  });

  it('чужое и испорченное сообщение не прокручивает', () => {
    expect(readPreviewScroll({ type: 'payload-live-preview', ratio: 0.5 })).toBeNull();
    expect(readPreviewScroll({ type: 'whg-preview-scroll', ratio: 'half' })).toBeNull();
    expect(readPreviewScroll('whg-preview-scroll')).toBeNull();
  });
});
