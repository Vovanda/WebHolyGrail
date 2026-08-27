import { describe, expect, it } from 'vitest';

import { panelMatchesRoute } from './panel-routes';

/**
 * Ошибка здесь либо уносит панель со страницы, где её ждут, либо вешает её
 * на весь сайт - и то и другое видно сразу и всем.
 */

describe('панель без масок', () => {
  it('показывается везде', () => {
    expect(panelMatchesRoute(undefined, '/blog')).toBe(true);
    expect(panelMatchesRoute([], '/blog')).toBe(true);
  });
});

describe('точный адрес', () => {
  it('совпадает сам с собой', () => {
    expect(panelMatchesRoute(['/video'], '/video')).toBe(true);
  });

  it('не цепляет соседей', () => {
    expect(panelMatchesRoute(['/video'], '/video-kurs')).toBe(false);
    expect(panelMatchesRoute(['/video'], '/blog')).toBe(false);
  });

  it('хвостовая косая черта ничего не меняет', () => {
    expect(panelMatchesRoute(['/video'], '/video/')).toBe(true);
    expect(panelMatchesRoute(['/video/'], '/video')).toBe(true);
  });
});

describe('звёздочка на конце', () => {
  it('берёт и сам адрес, и всё, что дальше', () => {
    expect(panelMatchesRoute(['/@whg/p/*'], '/@whg/p')).toBe(true);
    expect(panelMatchesRoute(['/@whg/p/*'], '/@whg/p/ZGVTAYZ')).toBe(true);
  });

  it('не выходит за свою ветку', () => {
    expect(panelMatchesRoute(['/@whg/p/*'], '/@whg/v/RsrNVjJ')).toBe(false);
    expect(panelMatchesRoute(['/video/*'], '/videoteka')).toBe(false);
  });
});

describe('звёздочка в середине', () => {
  it('берёт любой канал', () => {
    expect(panelMatchesRoute(['/@*/p/*'], '/@whg/p/ZGVTAYZ')).toBe(true);
    expect(panelMatchesRoute(['/@*/p/*'], '/@другой/p/ABC')).toBe(true);
  });

  it('различает соседние ветки', () => {
    expect(panelMatchesRoute(['/@*/p/*'], '/@whg/v/RsrNVjJ')).toBe(false);
  });

  it('заменяет ровно один кусочек', () => {
    expect(panelMatchesRoute(['/@*/p'], '/@whg/p')).toBe(true);
    expect(panelMatchesRoute(['/@*/p'], '/@whg/x/p')).toBe(false);
  });
});

describe('несколько масок', () => {
  it('хватает одного совпадения', () => {
    expect(panelMatchesRoute(['/video', '/@*/p/*'], '/video')).toBe(true);
  });
});

describe('адрес неизвестен', () => {
  it('панель показывается: пропавшая заметнее лишней', () => {
    expect(panelMatchesRoute(['/video'], null)).toBe(true);
  });
});
