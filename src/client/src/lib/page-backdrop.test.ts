import type { SiteSettings } from 'contracts';
import { describe, expect, it } from 'vitest';

import { blockSpaceVars, hasBackdrop } from './page-backdrop';

const settings = (extra: Partial<SiteSettings>): SiteSettings =>
  ({ siteName: 'Сайт', contacts: {}, mainNav: [], ...extra }) as SiteSettings;

describe('фон страницы задан', () => {
  it('нет картинок - нет фона', () => {
    expect(hasBackdrop(settings({}))).toBe(false);
    expect(hasBackdrop(settings({ pageBackground: { image: null, imageDark: null } }))).toBe(false);
  });

  it('достаточно одной картинки любой темы', () => {
    expect(hasBackdrop(settings({ pageBackground: { image: '12' } }))).toBe(true);
    expect(hasBackdrop(settings({ pageBackground: { imageDark: '13' } }))).toBe(true);
  });
});

describe('шаг секции', () => {
  it('пустые поля переменных не ставят', () => {
    expect(blockSpaceVars(settings({}))).toBeUndefined();
    expect(blockSpaceVars(settings({ blockSpace: { narrow: '  ', wide: '' } }))).toBeUndefined();
  });

  it('заданное поле идёт своей переменной', () => {
    expect(blockSpaceVars(settings({ blockSpace: { narrow: '1rem' } }))).toEqual({
      '--block-space-narrow': '1rem',
    });
    expect(blockSpaceVars(settings({ blockSpace: { narrow: '1rem', wide: '3rem' } }))).toEqual({
      '--block-space-narrow': '1rem',
      '--block-space-wide': '3rem',
    });
  });
});
