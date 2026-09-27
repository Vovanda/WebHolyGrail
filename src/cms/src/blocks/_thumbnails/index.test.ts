import type { Block } from 'payload';
import { describe, expect, it } from 'vitest';

import { ENGINE_PAGE_BLOCKS } from '../engine';
import { withThumbnail } from './index';

function thumbnailUrl(block: Block): string | undefined {
  const thumbnail = block.admin?.images?.thumbnail;
  return typeof thumbnail === 'string' ? thumbnail : thumbnail?.url;
}

describe('схемы блоков в окне выбора', () => {
  it('у каждого блока движка своя схема', () => {
    const missing = ENGINE_PAGE_BLOCKS.filter((block) => !thumbnailUrl(block)).map(
      (block) => block.slug,
    );
    expect(missing).toEqual([]);
  });

  it('схема - SVG 240×160 в data-URI', () => {
    for (const block of ENGINE_PAGE_BLOCKS) {
      const url = thumbnailUrl(block) ?? '';
      expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
      const markup = decodeURIComponent(url.slice(url.indexOf(',') + 1));
      expect(markup).toMatch(/^<svg [^>]*viewBox="0 0 240 160"/);
      expect(markup.endsWith('</svg>')).toBe(true);
    }
  });

  it('у схем разный рисунок', () => {
    const urls = ENGINE_PAGE_BLOCKS.map(thumbnailUrl);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('блок без схемы остаётся с заглушкой Payload', () => {
    const block: Block = { slug: 'no-such-block', fields: [] };
    expect(withThumbnail(block)).toBe(block);
  });
});
