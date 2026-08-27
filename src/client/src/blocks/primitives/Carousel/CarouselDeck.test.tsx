import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CarouselDeck, CarouselItem } from './CarouselDeck';

/**
 * Карусель рисуется строкой: разметка, подписи и размеры карточек видны без
 * браузера. Жест, петля и подъезд к активному кадру - работа движка, их
 * проверяет сквозной прогон.
 */

function cards(count: number) {
  return Array.from({ length: count }, (_, i) => (
    <CarouselItem key={i} width="16rem">
      <article>Карточка {i + 1}</article>
    </CarouselItem>
  ));
}

describe('CarouselDeck', () => {
  it('показывает все карточки плейлиста', () => {
    const html = renderToStaticMarkup(<CarouselDeck>{cards(5)}</CarouselDeck>);
    expect(html.match(/<article>/g)).toHaveLength(5);
  });

  it('карточке отдаётся заданная ширина', () => {
    const html = renderToStaticMarkup(<CarouselDeck>{cards(2)}</CarouselDeck>);
    expect(html).toContain('flex-basis:16rem');
    expect(html).toContain('width:16rem');
  });

  it('кадр во всю ширину занимает ленту целиком', () => {
    const html = renderToStaticMarkup(
      <CarouselDeck mode="single">
        <CarouselItem width="full">
          <img src="/a.jpg" alt="" />
        </CarouselItem>
      </CarouselDeck>,
    );
    expect(html).toContain('basis-full');
  });

  it('подпись для чтения с экрана уходит в разметку', () => {
    const html = renderToStaticMarkup(
      <CarouselDeck label="Видео плейлиста">{cards(3)}</CarouselDeck>,
    );
    expect(html).toContain('aria-label="Видео плейлиста"');
    expect(html).toContain('aria-roledescription="carousel"');
  });

  it('высота секции задаётся снаружи', () => {
    const html = renderToStaticMarkup(<CarouselDeck height="18rem">{cards(2)}</CarouselDeck>);
    expect(html).toContain('height:18rem');
  });

  it('пропорции кадра работают вместо высоты', () => {
    const html = renderToStaticMarkup(<CarouselDeck aspect="16 / 9">{cards(2)}</CarouselDeck>);
    expect(html).toContain('aspect-ratio:16 / 9');
  });

  it('отступ по краям держит первую карточку от края экрана', () => {
    const withEdge = renderToStaticMarkup(<CarouselDeck edge="md">{cards(2)}</CarouselDeck>);
    const without = renderToStaticMarkup(<CarouselDeck>{cards(2)}</CarouselDeck>);
    expect(withEdge).toContain('px-4');
    expect(without).not.toContain('px-4');
  });
});
