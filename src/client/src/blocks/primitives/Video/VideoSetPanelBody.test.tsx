import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { VideoSetItem } from 'contracts';

import { VideoSetPanelBody } from './VideoSetPanelBody';

/**
 * Панель показывает тот же плейлист, что и список рядом с плеером, поэтому
 * важно, что она рисует все видео - и закрытые тоже: состав плейлиста это его
 * витрина, по названию видно, что человек получит за код.
 */

function item(over: Partial<VideoSetItem> & { id: number; code: string; title: string }) {
  return {
    poster: null,
    playlistUrl: 'https://example.test/master.m3u8',
    locked: false,
    ready: true,
    ...over,
  } as VideoSetItem;
}

const items = [
  item({ id: 1, code: 'aaa', title: 'Первое видео' }),
  item({ id: 2, code: 'bbb', title: 'Второе видео', locked: true }),
];

describe('плейлист в панели', () => {
  it('показывает и открытые, и закрытые', () => {
    const html = renderToStaticMarkup(
      <VideoSetPanelBody items={items} channel="whg" setCode="set-1" />,
    );

    expect(html).toContain('Первое видео');
    expect(html).toContain('Второе видео');
  });

  it('закрытое ведёт к вводу кода, а не в никуда', () => {
    const html = renderToStaticMarkup(
      <VideoSetPanelBody items={items} channel="whg" setCode="set-1" />,
    );

    expect(html).toContain('data-access-code');
  });

  it('пустой плейлист рисует пустой список, а не падает', () => {
    const html = renderToStaticMarkup(
      <VideoSetPanelBody items={[]} channel={null} setCode={null} />,
    );

    expect(html).not.toContain('Первое видео');
  });
});
