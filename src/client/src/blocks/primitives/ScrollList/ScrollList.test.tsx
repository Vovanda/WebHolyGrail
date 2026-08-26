import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ScrollList } from './ScrollList';

/**
 * Список рисуется строкой: порции и потолок высоты видны в разметке, и jsdom
 * для этого не нужен. Прокрутка и память места живут в браузере и проверяются
 * сквозным прогоном.
 */

function rows(count: number) {
  return Array.from({ length: count }, (_, i) => <li key={i}>Строка {i + 1}</li>);
}

describe('ScrollList', () => {
  it('без ограничения показывает весь набор', () => {
    const html = renderToStaticMarkup(<ScrollList>{rows(12)}</ScrollList>);
    expect(html.match(/<li>/g)).toHaveLength(12);
    expect(html).not.toContain('Показать ещё');
  });

  it('с ограничением показывает первую порцию и предлагает остальное', () => {
    const html = renderToStaticMarkup(<ScrollList limit={4}>{rows(10)}</ScrollList>);
    expect(html.match(/<li>/g)).toHaveLength(4);
    expect(html).toContain('Показать ещё 4 из 6');
  });

  it('последняя порция предлагает ровно остаток, а не полный шаг', () => {
    const html = renderToStaticMarkup(
      <ScrollList limit={4} step={4}>
        {rows(6)}
      </ScrollList>,
    );
    expect(html).toContain('Показать ещё 2 из 2');
  });

  it('прокрутка вместо кнопки кнопку не рисует', () => {
    const html = renderToStaticMarkup(
      <ScrollList limit={3} more="scroll">
        {rows(9)}
      </ScrollList>,
    );
    expect(html.match(/<li>/g)).toHaveLength(3);
    expect(html).not.toContain('Показать ещё');
  });

  it('потолок высоты включает свою прокрутку', () => {
    const html = renderToStaticMarkup(<ScrollList maxHeight="20rem">{rows(3)}</ScrollList>);
    expect(html).toContain('overflow-y-auto');
    expect(html).toContain('max-height:20rem');
  });

  it('без потолка список растёт вместе со страницей', () => {
    const html = renderToStaticMarkup(<ScrollList>{rows(3)}</ScrollList>);
    expect(html).toContain('overflow-visible');
    expect(html).not.toContain('max-height');
  });

  it('пустому набору показывает подсказку вместо списка', () => {
    const html = renderToStaticMarkup(<ScrollList empty={<p>Пока пусто</p>}>{[]}</ScrollList>);
    expect(html).toBe('<p>Пока пусто</p>');
  });
});
