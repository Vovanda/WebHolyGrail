import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LayoutPushPanel, widthWithinScreen } from './LayoutPushPanel';

/**
 * Ширину панели задают в раскладке числом, не думая про телефон. Панель шире
 * экрана обрезает свой заголовок и съедает полоску страницы сбоку - ту самую,
 * по которой видно, что страница никуда не делась.
 */

describe('ширина панели', () => {
  it('простое значение ограничивается долей экрана', () => {
    expect(widthWithinScreen('25rem')).toBe('min(25rem, 88vw)');
    expect(widthWithinScreen('400px')).toBe('min(400px, 88vw)');
  });

  it('посчитанное автором значение не трогается', () => {
    expect(widthWithinScreen('min(21rem, 88vw)')).toBe('min(21rem, 88vw)');
    expect(widthWithinScreen('80vw')).toBe('80vw');
  });

  it('без значения остаётся значение примитива', () => {
    expect(widthWithinScreen(undefined)).toBeUndefined();
  });
});

describe('панель', () => {
  it('рисует язычок с названием', () => {
    const html = renderToStaticMarkup(
      <LayoutPushPanel side="right" width="25rem" title="Плейлист">
        <p>список</p>
      </LayoutPushPanel>,
    );

    // Сама панель уезжает порталом в конец страницы, поэтому в строке остаётся
    // только язычок: содержимое появляется уже в браузере.
    expect(html).toContain('Плейлист');
    expect(html).toContain('aria-expanded="false"');
  });
});
