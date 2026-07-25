import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SectionEyebrow } from './SectionEyebrow';

describe('SectionEyebrow', () => {
  it('рендерит подпись капсом с линией под ней', () => {
    const html = renderToStaticMarkup(<SectionEyebrow>Последние</SectionEyebrow>);

    expect(html).toContain('<h2');
    expect(html).toContain('uppercase');
    expect(html).toContain('border-b border-border');
    expect(html).toContain('Последние');
  });

  it('уровень заголовка задаётся через as', () => {
    const html = renderToStaticMarkup(<SectionEyebrow as="h3">Избранное</SectionEyebrow>);

    expect(html).toContain('<h3');
    expect(html).not.toContain('<h2');
  });

  it('правый край показывается только когда передан', () => {
    const withAside = renderToStaticMarkup(
      <SectionEyebrow aside="4 статьи">Последние</SectionEyebrow>,
    );
    const withoutAside = renderToStaticMarkup(<SectionEyebrow>Последние</SectionEyebrow>);

    expect(withAside).toContain('4 статьи');
    expect(withoutAside).not.toContain('text-muted');
  });
});
