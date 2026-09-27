import type { MediaDoc, SiteSettings } from 'contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Hero } from './Hero';

const settings = { siteName: 'Сайт', contacts: {}, mainNav: [] } as unknown as SiteSettings;
const photo = {
  id: '7',
  url: 'https://site.ru/media/room.webp?v=1',
  alt: 'Комната',
  width: 1664,
  height: 928,
} as MediaDoc;

const render = (data: Record<string, unknown>) =>
  renderToStaticMarkup(
    <Hero node={{ id: 'h', type: 'hero', data } as never} settings={settings} />,
  );

describe('Hero', () => {
  it('без фото - только текст, без вуали', () => {
    const html = render({ title: 'Чистые помещения' });
    expect(html).toContain('Чистые помещения');
    expect(html).not.toContain('data-part="veil"');
    expect(html).not.toContain('room.webp');
  });

  it('с фото - кадр под текстом и вуаль по умолчанию 60%', () => {
    const html = render({ title: 'Чистые помещения', photo });
    expect(html).toContain('room.webp');
    expect(html).toContain('data-part="veil"');
    expect(html).toContain('opacity:0.6');
  });

  it('вуаль из поля', () => {
    expect(render({ title: 'Т', photo, veil: 25 })).toContain('opacity:0.25');
  });

  it('фото номером без документа не рисуется', () => {
    expect(render({ title: 'Т', photo: '7' })).not.toContain('data-part="veil"');
  });
});
