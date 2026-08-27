import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SiteLayoutConfig, SiteSettings } from 'contracts';

import { SiteLayout } from './SiteLayout';

/**
 * Раскладка одна на весь сайт, поэтому отбор панелей по адресу решает, что
 * человек увидит на странице. Ошибка здесь либо уносит панель оттуда, где её
 * ждут, либо вешает её везде.
 */

const settings = { siteName: 'Проверка' } as SiteSettings;

function layoutWith(routes?: ReadonlyArray<string>): SiteLayoutConfig {
  return {
    grid: { template: 'classic-site' },
    panels: [
      {
        id: 'везде',
        slot: 'top',
        content: { kind: 'block', node: { blockType: 'header', id: 'h', data: {} } },
      },
      {
        id: 'только-видео',
        slot: 'bottom',
        content: { kind: 'block', node: { blockType: 'footer', id: 'f', data: {} } },
        ...(routes ? { routes } : {}),
      },
    ],
  };
}

function panelsOn(pathname: string | null, routes?: ReadonlyArray<string>): string[] {
  const html = renderToStaticMarkup(
    <SiteLayout config={layoutWith(routes)} settings={settings} pathname={pathname}>
      <main>содержимое</main>
    </SiteLayout>,
  );
  return [...html.matchAll(/data-panel-id="([^"]+)"/g)].map((m) => m[1] as string);
}

describe('сдвигающая панель', () => {
  it('собирается раскладкой и рисуется целиком', () => {
    const config: SiteLayoutConfig = {
      grid: { template: 'classic-site' },
      panels: [
        {
          id: 'сдвигающая',
          slot: 'right',
          mobile: 'push',
          size: '21rem',
          content: { kind: 'block', node: { blockType: 'footer', id: 'f', data: {} } },
          meta: { title: 'Плейлист' },
        },
      ],
    };

    // Раскладка серверная, а панель клиентская: функцию между ними передать
    // нельзя, и раньше это валило страницу целиком уже при отрисовке.
    const html = renderToStaticMarkup(
      <SiteLayout config={config} settings={settings} pathname="/video">
        <main>содержимое</main>
      </SiteLayout>,
    );

    expect(html).toContain('data-panel-id="сдвигающая"');
    expect(html).toContain('Плейлист');
  });
});

describe('отбор панелей по адресу', () => {
  it('без масок панель показывается везде', () => {
    expect(panelsOn('/blog')).toContain('только-видео');
  });

  it('на своём адресе панель на месте', () => {
    expect(panelsOn('/video', ['/video'])).toContain('только-видео');
  });

  it('на чужом адресе панели нет, остальные остаются', () => {
    const panels = panelsOn('/blog', ['/video']);
    expect(panels).not.toContain('только-видео');
    expect(panels).toContain('везде');
  });

  it('маска со звёздочкой берёт вложенные адреса', () => {
    expect(panelsOn('/@whg/p/ZGVTAYZ', ['/@*/p/*'])).toContain('только-видео');
  });

  it('адрес неизвестен - панель показывается', () => {
    expect(panelsOn(null, ['/video'])).toContain('только-видео');
  });
});
