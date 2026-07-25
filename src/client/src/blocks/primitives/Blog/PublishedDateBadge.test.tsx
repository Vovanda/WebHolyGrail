import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PublishedDateBadge } from './PublishedDateBadge';

describe('PublishedDateBadge', () => {
  it('показывает дату без хвоста «г.»', () => {
    const html = renderToStaticMarkup(<PublishedDateBadge date="2026-05-02T10:00:00.000Z" />);

    expect(html).toContain('2 мая 2026');
    expect(html).not.toContain('г.');
  });

  it('оставляет машиночитаемую дату в атрибуте', () => {
    const html = renderToStaticMarkup(<PublishedDateBadge date="2025-12-24T00:00:00.000Z" />);

    // Имя атрибута сверяем без учёта регистра: в HTML он регистронезависим,
    // а React отдаёт его как `dateTime`.
    expect(html).toMatch(/datetime="2025-12-24T00:00:00\.000Z"/i);
  });
});
