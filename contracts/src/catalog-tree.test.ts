import { describe, expect, it } from 'vitest';

import { ancestorsOf, findNode, sectionPath, sectionTree } from './catalog-tree';

const sections = [
  { slug: 'tools', title: 'Инструмент' },
  { slug: 'drills', title: 'Перфораторы', parent: 'tools' },
  { slug: 'sds', title: 'SDS-plus', parent: 'drills' },
  { slug: 'paint', title: 'Краски' },
  { slug: 'empty', title: 'Пустой', parent: 'tools' },
];
const own = new Map([
  ['tools', 1],
  ['drills', 4],
  ['sds', 2],
  ['paint', 3],
]);

describe('дерево разделов', () => {
  it('счёт - вместе с подразделами, пустые ветки не попадают', () => {
    const tree = sectionTree(sections, own);
    expect(tree.map((n) => [n.slug, n.count])).toEqual([
      ['tools', 7],
      ['paint', 3],
    ]);
    expect(tree[0]!.children.map((n) => n.slug)).toEqual(['drills']);
    expect(findNode(tree, 'sds')?.count).toBe(2);
  });

  it('путь для крошек и предки', () => {
    expect(sectionPath(sections, 'sds').map((s) => s.title)).toEqual([
      'Инструмент',
      'Перфораторы',
      'SDS-plus',
    ]);
    expect(ancestorsOf(sections, 'sds')).toEqual(['drills', 'tools']);
    expect(sectionPath(sections, 'nope')).toEqual([]);
  });

  it('цикл в данных рвётся, раздел не становится своим предком', () => {
    const looped = [
      { slug: 'a', title: 'A', parent: 'b' },
      { slug: 'b', title: 'B', parent: 'a' },
      { slug: 'c', title: 'C', parent: 'c' },
    ];
    expect(sectionPath(looped, 'a').length).toBeLessThanOrEqual(2);
    expect(sectionPath(looped, 'c').map((s) => s.slug)).toEqual(['c']);
    const tree = sectionTree(
      looped,
      new Map([
        ['a', 1],
        ['b', 1],
        ['c', 1],
      ]),
    );
    expect(tree.reduce((n, x) => n + x.count, 0)).toBe(3);
  });

  it('родитель, которого нет среди разделов, - раздел верхний', () => {
    expect(sectionPath([{ slug: 'x', title: 'X', parent: 'gone' }], 'x')).toEqual([
      { slug: 'x', title: 'X' },
    ]);
  });
});
