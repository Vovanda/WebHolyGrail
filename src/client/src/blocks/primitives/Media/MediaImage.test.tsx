import type { MediaDoc } from 'contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MediaImage } from './MediaImage';

const photo = {
  id: '39',
  url: 'https://site.ru/media/IMG_2198.webp?v=1',
  alt: 'Чистое помещение',
  width: 5712,
  height: 4284,
  sizes: {
    thumbnail: { url: 'https://site.ru/media/IMG-400x300.webp', width: 400, height: 300 },
    card: { url: 'https://site.ru/media/IMG-768x576.webp', width: 768, height: 576 },
    hero: { url: 'https://site.ru/media/IMG-1920x1440.webp', width: 1920, height: 1440 },
  },
} as MediaDoc;

/** Файл без копий: размывать нечего, кадр идёт без рамки. */
const bare = {
  id: '40',
  url: 'https://site.ru/media/IMG_2198.webp?v=1',
  alt: 'Чистое помещение',
  width: 5712,
  height: 4284,
} as MediaDoc;

describe('MediaImage', () => {
  it('отдаёт браузеру list вариантов и место показа', () => {
    const html = renderToStaticMarkup(
      <MediaImage media={photo} place="(max-width: 768px) 100vw, 768px" />,
    );

    expect(html).toContain('IMG-400x300.webp 400w');
    expect(html).toContain('IMG-768x576.webp 768w');
    expect(html).toContain('IMG-1920x1440.webp 1920w');
    expect(html).toContain('sizes="(max-width: 768px) 100vw, 768px"');
  });

  it('в разметке идёт весь набор: на обычной сети кадр приходит одним запросом', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} />);
    const list = /srcSet="([^"]*)"/.exec(html)?.[1] ?? '';

    expect(list).toContain('IMG-400x300.webp 400w');
    expect(list).toContain('IMG-768x576.webp 768w');
    expect(list).toContain('IMG-1920x1440.webp 1920w');
    // Место показа - правда о вёрстке; сужает его помощник, когда видит слабую сеть.
    expect(html).toContain('sizes="100vw"');
  });

  it('оригинал доступен в ленте и отдельной кнопкой, но не в разметке страницы', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} />);
    const shown = /srcSet="([^"]*)"/.exec(html)?.[1] ?? '';
    const lane = /data-zoom="([^"]*)"/.exec(html)?.[1] ?? '';

    expect(shown).not.toContain('IMG_2198.webp');
    expect(lane).toContain('IMG_2198.webp?v=1 5712w');
    expect(html).toContain('data-zoom-full="https://site.ru/media/IMG_2198.webp?v=1"');
  });

  it('файл без вариантов показывает самим файлом, без перечня', () => {
    const { sizes: _cut, ...bare } = photo;
    const html = renderToStaticMarkup(<MediaImage media={bare} />);

    expect(html).toContain('src="https://site.ru/media/IMG_2198.webp?v=1"');
    expect(html).not.toContain('srcset');
  });

  it('подпись берёт у файла, а своя главнее', () => {
    expect(renderToStaticMarkup(<MediaImage media={photo} />)).toContain('alt="Чистое помещение"');
    expect(renderToStaticMarkup(<MediaImage media={photo} alt="Этап 7" />)).toContain(
      'alt="Этап 7"',
    );
  });

  it('размер кадра проставляет, чтобы страница не прыгала при загрузке', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} />);

    expect(html).toContain('width="5712"');
    expect(html).toContain('height="4284"');
  });

  it('размечен частью, чтобы вид блока до него дотянулся', () => {
    expect(renderToStaticMarkup(<MediaImage media={photo} />)).toContain('data-part="media-image"');
  });

  it('голый номер вместо документа не рисует ничего', () => {
    expect(renderToStaticMarkup(<MediaImage media="39" />)).toBe('');
    expect(renderToStaticMarkup(<MediaImage media={null} />)).toBe('');
  });

  it('по умолчанию грузится лениво, а главный кадр - shown', () => {
    expect(renderToStaticMarkup(<MediaImage media={photo} />)).toContain('loading="lazy"');

    const hero = renderToStaticMarkup(
      <MediaImage media={photo} loading="eager" fetchPriority="high" />,
    );
    expect(hero).toContain('loading="eager"');
    expect(hero).toContain(String.raw`fetchPriority="high"`);
  });
});

describe('показ ступенями', () => {
  const withPlaceholder = { ...photo, blurData: 'data:image/webp;base64,AAA' } as MediaDoc;

  it('кадр с заготовкой рисуется сразу, чтобы размытие не мигало на обновлении', () => {
    const html = renderToStaticMarkup(<MediaImage media={withPlaceholder} place="768px" />);
    expect(html).toContain('decoding="sync"');
    expect(html).toContain('data-part="media-image-blur"');
  });

  it('кадр без заготовки и копий идёт без рамки и откладывает отрисовку', () => {
    const html = renderToStaticMarkup(<MediaImage media={bare} place="768px" />);
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain('media-image-frame');
    expect(html).not.toContain('media-image-blur');
  });

  it('залитый раньше файл без заготовки размывает наименьшую копию', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} place="768px" />);
    expect(html).toContain('data-part="media-image-blur"');
    expect(html).toContain(
      'background-image:url(&quot;https://site.ru/media/IMG-400x300.webp&quot;)',
    );
  });

  it('место показа лежит рядом: помощник вернёт его после мелкой ступени', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} place="832px" />);
    expect(html).toContain('data-place="832px"');
  });

  it('кадр обёрнут ссылкой на файл - нажатие работает и до прихода скрипта', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} place="768px" />);
    expect(html).toContain('data-zoom-link');
    expect(html).toContain('href="https://site.ru/media/IMG_2198.webp?v=1"');
  });

  it('служебной картинке ссылка не нужна: её лента не открывает', () => {
    const html = renderToStaticMarkup(<MediaImage media={photo} place="64px" zoom={false} />);
    expect(html).not.toContain('data-zoom-link');
  });

  /** Открывающий тег первого элемента с этим признаком. */
  const tagOf = (html: string, marker: string) =>
    html.match(new RegExp(`<[^>]*${marker}[^>]*>`))?.[0] ?? '';

  it('пропорция кадра стоит на элементе с классами места - на снимке без заготовки', () => {
    const tag = tagOf(
      renderToStaticMarkup(<MediaImage media={bare} className="media-single" />),
      'data-part="media-image"',
    );
    expect(tag).toContain('media-single');
    expect(tag).toContain('--media-ratio:1.333');
  });

  it('пропорция кадра стоит на рамке, когда есть заготовка: у рамки нет своей ширины', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        media={{ ...photo, blurData: 'data:image/webp;base64,AA' } as MediaDoc}
        className="media-single"
      />,
    );
    const frame = tagOf(html, 'data-part="media-image-frame"');
    expect(frame).toContain('media-single');
    expect(frame).toContain('--media-ratio:1.333');
  });

  it('форма места главнее формы снимка: рамка 16:9, кадр подрезается', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        media={{ ...photo, blurData: 'data:image/webp;base64,AA' } as MediaDoc}
        aspect={{ width: 16, height: 9 }}
        className="media-single"
      />,
    );
    const frame = tagOf(html, 'data-part="media-image-frame"');
    expect(frame).toContain('aspect-ratio:16 / 9');
    expect(frame).toContain('--media-ratio:1.777');
    expect(tagOf(html, 'data-part="media-image"')).toContain('object-cover');
  });

  it('заготовка подрезается вокруг той же точки, что и снимок', () => {
    const html = renderToStaticMarkup(
      <MediaImage
        media={
          { ...photo, blurData: 'data:image/webp;base64,AA', focalX: 20, focalY: 70 } as MediaDoc
        }
        aspect={{ width: 9, height: 16 }}
      />,
    );
    expect(tagOf(html, 'data-part="media-image-blur"')).toContain('background-position:20% 70%');
    expect(tagOf(html, 'data-part="media-image"')).toContain('object-position:20% 70%');
  });

  it('без заготовки форма места ложится на сам снимок', () => {
    const tag = tagOf(
      renderToStaticMarkup(<MediaImage media={bare} aspect={{ width: 9, height: 16 }} />),
      'data-part="media-image"',
    );
    expect(tag).toContain('aspect-ratio:9 / 16');
    expect(tag).toContain('object-fit:cover');
  });
});
