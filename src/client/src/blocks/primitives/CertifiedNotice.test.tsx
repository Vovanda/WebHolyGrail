import type { SiteSettings } from 'contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CertifiedNotice } from './CertifiedNotice';

const settings = {} as SiteSettings;

describe('CertifiedNotice', () => {
  it('два одинаковых пункта показываются оба', () => {
    const html = renderToStaticMarkup(
      <CertifiedNotice
        node={{
          id: 'n1',
          blockType: 'certified-notice',
          data: {
            title: 'Статус',
            criteria: [
              { id: 'a', text: 'Проверено' },
              { id: 'b', text: 'Проверено' },
              { id: 'c', text: '  ' },
            ],
          },
        }}
        settings={settings}
      />,
    );
    expect(html.match(/data-part="item"/g)).toHaveLength(2);
  });
});
