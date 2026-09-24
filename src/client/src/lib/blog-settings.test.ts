import { describe, expect, it } from 'vitest';

import { blogColumn, resolveBlogSettings } from './blog-settings';

describe('колонка блога', () => {
  it('три варианта дают три ширины', () => {
    expect(blogColumn('page')).toEqual({ className: 'max-w-wide', width: 1300 });
    expect(blogColumn('medium')).toEqual({ className: 'max-w-medium', width: 1080 });
    expect(blogColumn('reading')).toEqual({ className: 'max-w-content', width: 880 });
  });

  it('пусто - ширина страницы', () => {
    expect(blogColumn(undefined)).toEqual(blogColumn('page'));
    expect(blogColumn(null)).toEqual(blogColumn('page'));
  });

  it('незнакомое значение не ломает показ', () => {
    expect(blogColumn('huge' as never)).toEqual(blogColumn('page'));
    expect(blogColumn('toString' as never)).toEqual(blogColumn('page'));
  });

  it('у настроек без группы блога колонка как у страницы', () => {
    expect(resolveBlogSettings(null).columnWidth).toBe('page');
  });
});
