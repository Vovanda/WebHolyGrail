import { renderToStaticMarkup } from 'react-dom/server';
import type { VideoSetRef } from 'contracts';
import { describe, expect, it } from 'vitest';

import { VideoSetLinks } from './VideoSetLinks';

/** Перечень плейлистов - серверная разметка, проверяется строкой. */

const sets: VideoSetRef[] = [
  { id: 1, code: 'AAA1111', title: 'Демо плейлист', count: 3 },
  { id: 2, code: 'BBB2222', title: 'Второй плейлист', count: 7 },
];

describe('VideoSetLinks', () => {
  it('показывает плейлисты ссылками на канал автора', () => {
    const html = renderToStaticMarkup(<VideoSetLinks sets={sets} channel="whg" />);
    expect(html).toContain('/@whg/p/AAA1111');
    expect(html).toContain('Демо плейлист');
    expect(html).toContain('3 видео');
  });

  it('плейлист, показанный выше, здесь не повторяется', () => {
    const html = renderToStaticMarkup(
      <VideoSetLinks sets={sets} channel="whg" currentSetCode="AAA1111" />,
    );
    expect(html).not.toContain('Демо плейлист');
    expect(html).toContain('Второй плейлист');
  });

  it('без плейлистов перечень не рисуется', () => {
    expect(renderToStaticMarkup(<VideoSetLinks sets={[]} channel="whg" />)).toBe('');
  });

  it('единственный плейлист, он же открытый, оставляет страницу без перечня', () => {
    const html = renderToStaticMarkup(
      <VideoSetLinks sets={[sets[0]!]} channel="whg" currentSetCode="AAA1111" />,
    );
    expect(html).toBe('');
  });
});
