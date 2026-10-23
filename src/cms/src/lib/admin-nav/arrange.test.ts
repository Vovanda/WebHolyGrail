import { describe, expect, it } from 'vitest';

import { arrangeNav, type NavGroup } from './arrange';

const c = (slug: string) => ({ slug, type: 'collections' });
const g = (slug: string) => ({ slug, type: 'globals' });

const GROUPS: NavGroup[] = [
  { label: 'Контент', entities: [c('pages')] },
  { label: 'Блог', entities: [c('articles'), c('tags')] },
  {
    label: 'Настройки',
    entities: [c('feature-toggles'), c('users'), c('payload-jobs'), g('site-settings')],
  },
];

const on = () => true;
const labels = (groups: NavGroup[]) => groups.map((group) => group.label);

describe('меню админки', () => {
  it('без сохранённого порядка группы стоят как в конфиге', () => {
    expect(labels(arrangeNav(GROUPS, [], on))).toEqual(['Контент', 'Блог', 'Настройки']);
  });

  it('сохранённый порядок переставляет знакомые группы', () => {
    expect(labels(arrangeNav(GROUPS, ['Настройки', 'Блог', 'Контент'], on))).toEqual([
      'Настройки',
      'Блог',
      'Контент',
    ]);
  });

  it('группа вне сохранённого порядка остаётся на своём месте в конфиге', () => {
    const withDomain: NavGroup[] = [{ label: 'Питомник', entities: [c('litters')] }, ...GROUPS];
    expect(labels(arrangeNav(withDomain, ['Настройки', 'Блог', 'Контент'], on))).toEqual([
      'Питомник',
      'Настройки',
      'Блог',
      'Контент',
    ]);
  });

  it('«Настройки сайта» вторыми, хоть глобал и пришёл последним', () => {
    const settings = arrangeNav(GROUPS, [], on).find((group) => group.label === 'Настройки');
    expect(settings?.entities.map((entity) => entity.slug)).toEqual([
      'users',
      'site-settings',
      'feature-toggles',
      'payload-jobs',
    ]);
  });

  it('разделы выключенного модуля пропадают, пустая группа - тоже', () => {
    const arranged = arrangeNav(GROUPS, [], (key) => key !== 'blog');
    expect(labels(arranged)).toEqual(['Контент', 'Настройки']);
  });
});
