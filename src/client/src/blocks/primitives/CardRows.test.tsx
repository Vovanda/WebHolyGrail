import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CardRows } from './CardRows';

/**
 * Порядок карточек в разметке важен сам по себе: на широком экране их
 * расставляет сетка, а ниже они текут потоком, и там порядок задаёт только
 * разметка.
 */

const eight = ['Первая', 'Вторая', 'Третья', 'Четвёртая', 'Пятая', 'Шестая', 'Седьмая', 'Восьмая'];

function names(html: string): string[] {
  return [...html.matchAll(/data-tile="([a-z]+)"/g)].map(([, name]) => name as string);
}

describe('CardRows', () => {
  it('без записи идёт своим порядком', () => {
    const html = renderToStaticMarkup(
      <CardRows items={eight}>{(item) => <span>{item}</span>}</CardRows>,
    );

    expect(names(html)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  });

  it('порядок в разметке берётся с малого экрана', () => {
    const html = renderToStaticMarkup(
      <CardRows
        items={eight}
        tileLayout="f 2a g : h 2a : b c d e"
        tileLayoutSm="f a : g h : b c : d e"
      >
        {(item) => <span>{item}</span>}
      </CardRows>,
    );

    // там плитки идут ровно как лежат, и переставить их некому
    expect(names(html)).toEqual(['f', 'a', 'g', 'h', 'b', 'c', 'd', 'e']);
    // содержимое едет со своей карточкой, а не остаётся на месте
    expect(html.indexOf('Шестая')).toBeLessThan(html.indexOf('Первая'));
  });

  it('на каждой ширине своё место', () => {
    const html = renderToStaticMarkup(
      <CardRows items={eight} tileLayout="f 2a g : h 2a : b c d e" tileLayoutMd="2a : b c">
        {(item) => <span>{item}</span>}
      </CardRows>,
    );

    // крупная на большом занимает две колонки, на среднем тоже, но в своей фигуре
    expect(html).toContain('--lg-span:4');
    expect(html).toContain('--md-span:4');
  });

  it('крупная карточка занимает столько, сколько написано', () => {
    const html = renderToStaticMarkup(
      <CardRows items={eight} tileLayout="f 2a g : h 2a : b c d e">
        {(item) => <span>{item}</span>}
      </CardRows>,
    );

    expect(html).toContain('data-tile="a" data-row="1" data-span="2"');
  });
});
