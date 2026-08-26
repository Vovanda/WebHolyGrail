import { renderToStaticMarkup } from 'react-dom/server';
import type { VideoSetItem } from 'contracts';
import { describe, expect, it } from 'vitest';

import { VideoSetList } from './VideoSetList';

/**
 * Проверяем, что список выбирает контрол по своему положению и что закрытые
 * видео остаются закрытыми: колонка идёт списком с порциями, лента - каруселью.
 */

function video(overrides: Partial<VideoSetItem> = {}): VideoSetItem {
  return {
    id: overrides.id ?? 1,
    code: overrides.code ?? 'aaa1111',
    title: overrides.title ?? 'Первое видео',
    poster: overrides.poster ?? null,
    durationSeconds: overrides.durationSeconds ?? 17,
    locked: overrides.locked ?? false,
    ready: overrides.ready ?? true,
    playlistUrl: overrides.playlistUrl ?? '/media/a/master.m3u8',
    ...overrides,
  } as VideoSetItem;
}

const three = [
  video({ id: 1, code: 'aaa1111', title: 'Первое' }),
  video({ id: 2, code: 'bbb2222', title: 'Второе', locked: true, playlistUrl: null }),
  video({ id: 3, code: 'ccc3333', title: 'Третье' }),
];

describe('VideoSetList', () => {
  it('колонкой рисует список, а не карусель', () => {
    const html = renderToStaticMarkup(<VideoSetList items={three} channel="whg" setCode="set1" />);
    expect(html).not.toContain('aria-roledescription="carousel"');
    expect(html).toContain('Первое');
    expect(html).toContain('Третье');
  });

  it('лентой рисует карусель', () => {
    const html = renderToStaticMarkup(
      <VideoSetList items={three} channel="whg" setCode="set1" orientation="horizontal" />,
    );
    expect(html).toContain('aria-roledescription="carousel"');
  });

  it('колонка получает потолок высоты и порции', () => {
    const html = renderToStaticMarkup(
      <VideoSetList items={three} channel="whg" setCode="set1" maxHeight="24rem" limit={2} />,
    );
    expect(html).toContain('max-height:24rem');
    expect(html).toContain('overflow-y-auto');
  });

  it('закрытое видео ведёт к вводу кода, а открытое - на свою страницу', () => {
    const html = renderToStaticMarkup(<VideoSetList items={three} channel="whg" setCode="set1" />);
    expect(html).toContain('data-access-code');
    expect(html).toContain('/@whg/v/aaa1111?set=set1');
  });

  it('набор без видео говорит об этом словами', () => {
    const html = renderToStaticMarkup(<VideoSetList items={[]} channel="whg" setCode="set1" />);
    expect(html).toContain('нет видео');
  });
});
