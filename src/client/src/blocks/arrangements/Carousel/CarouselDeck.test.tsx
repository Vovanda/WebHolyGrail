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

  it('заданная мера остаётся видимой шириной карточки', () => {
    const html = renderToStaticMarkup(<CarouselDeck>{cards(2)}</CarouselDeck>);
    // зазор живёт набивкой внутри карточки, поэтому к основе добавляется отдельно:
    // иначе карточки ужимались бы на его величину, лента из шести кадров умещалась
    // бы в окно целиком, и движок схлопывал бы положения
    expect(html).toContain('flex-basis:calc(16rem + var(--carousel-gap))');
    expect(html).toContain('width:calc(16rem + var(--carousel-gap))');
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

  it('зазор несёт сама карточка, а не промежуток между соседями', () => {
    const html = renderToStaticMarkup(<CarouselDeck>{cards(3)}</CarouselDeck>);
    // gap работает между соседями по разметке, а в круге движок уносит карточки
    // сдвигом - и на стыке зазор пропадал. Внутренний отступ едет вместе с карточкой.
    expect(html).not.toMatch(/class="[^"]*\bgap-\d/);
    expect(html).toContain('pl-[var(--carousel-gap)]');
  });

  it('меры берутся из переменной, а не из разметки', () => {
    const html = renderToStaticMarkup(<CarouselDeck gap="lg">{cards(3)}</CarouselDeck>);
    // значение лежит в слое стилей: правка из «Вида блока» приходит вне слоёв
    // и берёт верх, а стиль, записанный в разметке, перебить было бы нечем
    expect(html).toContain('data-gap="lg"');
    expect(html).not.toContain('--carousel-gap:');
  });

  it('части размечены - до каждой можно дотянуться видом блока', () => {
    const html = renderToStaticMarkup(<CarouselDeck dots>{cards(3)}</CarouselDeck>);
    for (const part of ['carousel', 'carousel-viewport', 'carousel-track', 'carousel-item']) {
      expect(html).toContain(`data-part="${part}"`);
    }
  });

  it('отступ по краям держит первую карточку от края экрана', () => {
    const withEdge = renderToStaticMarkup(<CarouselDeck edge="md">{cards(2)}</CarouselDeck>);
    const without = renderToStaticMarkup(<CarouselDeck>{cards(2)}</CarouselDeck>);
    expect(withEdge).toContain('px-4');
    expect(without).not.toContain('px-4');
  });
});
