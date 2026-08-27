import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PlaylistCover } from './PlaylistCover';

/**
 * Плейлист без лица выглядит поломкой: у соседей картинка, а у него пустое
 * место. Стопка кадров показывает, что это подборка, а не одно видео.
 */

describe('своя обложка', () => {
  it('показывается как есть, стопка не собирается', () => {
    const html = renderToStaticMarkup(
      <PlaylistCover cover="/своя.webp" covers={['/a.jpg', '/b.jpg']} />,
    );

    expect(html).toContain('/своя.webp');
    expect(html).not.toContain('/a.jpg');
  });
});

describe('стопка кадров', () => {
  it('собирается, когда своей обложки нет', () => {
    const html = renderToStaticMarkup(<PlaylistCover covers={['/a.jpg', '/b.jpg']} />);

    expect(html).toContain('/a.jpg');
    expect(html).toContain('/b.jpg');
  });

  it('первый кадр лежит сверху: он идёт в разметке последним', () => {
    const html = renderToStaticMarkup(<PlaylistCover covers={['/первый.jpg', '/второй.jpg']} />);

    expect(html.indexOf('/второй.jpg')).toBeLessThan(html.indexOf('/первый.jpg'));
  });

  it('глубже трёх кадров не показывает: в стопке их не видно', () => {
    const html = renderToStaticMarkup(<PlaylistCover covers={['/a', '/b', '/c', '/d']} />);

    expect(html).not.toContain('"/d"');
  });
});

describe('кадров нет вовсе', () => {
  it('остаётся ровная заливка, а не пустая стопка', () => {
    const html = renderToStaticMarkup(<PlaylistCover />);

    expect(html).toContain('bg-surface');
    expect(html).not.toContain('<img');
  });
});
