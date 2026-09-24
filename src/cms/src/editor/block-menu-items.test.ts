import { describe, expect, it } from 'vitest';

import {
  blockItemKey,
  blockSearchWords,
  blockSlugOf,
  frequentFirst,
  matchesQuery,
  pickerMatches,
  pickFrequent,
} from './block-menu-items';

const item = (slug: string) => ({ key: `block-${slug}` });
const keys = (items: readonly { key: string }[]) => items.map((it) => it.key);

describe('имя блока по ключу пункта', () => {
  it('пункт блока отдаёт имя', () => {
    expect(blockSlugOf('block-gallery')).toBe('gallery');
  });

  it('ключ и имя переводятся друг в друга', () => {
    expect(blockSlugOf(blockItemKey('videoSet'))).toBe('videoSet');
  });

  it('чужой пункт - не блок', () => {
    expect(blockSlugOf('upload')).toBeNull();
  });
});

describe('частые пункты', () => {
  const set = [item('hero'), item('gallery'), item('video'), item('faq')];

  it('идут в порядке перечня, а не набора', () => {
    expect(keys(pickFrequent(set, ['video', 'gallery']))).toEqual(['block-video', 'block-gallery']);
  });

  it('имя, которого нет в наборе, пропускается', () => {
    expect(keys(pickFrequent(set, ['gone', 'faq']))).toEqual(['block-faq']);
  });

  it('в окне частые сверху, остальные в порядке набора, без повторов', () => {
    expect(keys(frequentFirst(set, ['video', 'gallery']))).toEqual([
      'block-video',
      'block-gallery',
      'block-hero',
      'block-faq',
    ]);
  });

  it('пустой перечень оставляет набор как есть', () => {
    expect(keys(frequentFirst(set, []))).toEqual(keys(set));
  });
});

describe('поиск по подписи', () => {
  it('пустой поиск подходит всему', () => {
    expect(matchesQuery('Галерея', '  ')).toBe(true);
  });

  it('без учёта регистра', () => {
    expect(matchesQuery('Галерея', 'гал')).toBe(true);
  });

  it('ё и е не различаются', () => {
    expect(matchesQuery('Счётчик', 'счет')).toBe(true);
  });

  it('несовпадение отсекается', () => {
    expect(matchesQuery('Галерея', 'видео')).toBe(false);
  });
});

describe('слова поиска для остальных блоков', () => {
  const blocks = [
    { slug: 'gallery', labels: { singular: 'Галерея', plural: 'Галереи' } },
    { slug: 'timeline', labels: { singular: 'Таймлайн', plural: 'Таймлайны' } },
    { slug: 'faq', labels: { singular: { ru: 'Вопросы', en: 'FAQ' } } },
    { slug: 'custom', labels: { singular: () => 'Своя' } },
  ];

  it('частые не попадают, остальные дают имя и подписи', () => {
    expect(blockSearchWords(blocks, ['gallery'])).toEqual([
      'timeline',
      'Таймлайн',
      'Таймлайны',
      'faq',
      'Вопросы',
      'FAQ',
      'custom',
    ]);
  });

  it('повторы убраны', () => {
    expect(blockSearchWords([{ slug: 'a', labels: { singular: 'a', plural: 'a' } }], [])).toEqual([
      'a',
    ]);
  });
});

describe('поиск в окне выбора', () => {
  const banner = { key: 'block-banner-slider', label: 'Баннеры в слайдере' };

  it('находит по русской подписи', () => {
    expect(pickerMatches(banner, 'баннер')).toBe(true);
  });

  it('находит по прежнему английскому имени блока', () => {
    expect(pickerMatches(banner, 'banner')).toBe(true);
    expect(pickerMatches(banner, 'banner slider')).toBe(true);
  });

  it('чужое не находит', () => {
    expect(pickerMatches(banner, 'цитата')).toBe(false);
  });
});
