import { describe, expect, it } from 'vitest';

import { previewPath } from './preview';

describe('адрес предпросмотра', () => {
  it('у статьи ведёт в блог', () => {
    expect(previewPath('blog', 'first-note')).toMatch(/\/blog\/first-note$/);
  });

  it('у страницы ведёт в корень сайта', () => {
    expect(previewPath('', 'about')).toMatch(/\/about$/);
  });

  it('главная - это сам корень', () => {
    expect(previewPath('', '')).toMatch(/\/$/);
    expect(previewPath('', 'home')).toMatch(/\/$/);
  });

  it('лишние косые в адресе не создают пустых уровней', () => {
    expect(previewPath('blog', '/first-note/')).toMatch(/\/blog\/first-note$/);
  });

  it('без адреса записи предпросмотр не предлагается', () => {
    expect(previewPath('blog', null)).toBeNull();
    expect(previewPath('blog', '')).toBeNull();
  });
});
