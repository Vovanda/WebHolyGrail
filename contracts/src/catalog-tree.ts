/**
 * Дерево разделов каталога (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Раздел знает только своего родителя - так его и заводят в админке. Всё
 * остальное (дети, путь для крошек, счёт позиций вместе с подразделами)
 * выводится здесь. Цикл, который могли оставить данные, обрывается: раздел не
 * бывает своим предком, сколько бы ни ошиблись в записи.
 */

/** Раздел для дерева: слаг, название, родитель и картинка плитки. */
export interface SectionLink {
  readonly slug: string;
  readonly title: string;
  /** Слаг родителя; пусто - верхний раздел. */
  readonly parent?: string | null | undefined;
  readonly image?: unknown;
}

/** Узел дерева: позиций - вместе со всеми подразделами. */
export interface SectionNode {
  readonly slug: string;
  readonly title: string;
  readonly image?: unknown;
  readonly count: number;
  readonly children: readonly SectionNode[];
}

/** Родитель раздела, если он есть среди разделов и не замыкает цикл. */
function parentsOf(sections: readonly SectionLink[]): Map<string, string | null> {
  const known = new Set(sections.map((s) => s.slug));
  const parent = new Map<string, string | null>();
  for (const s of sections) {
    parent.set(s.slug, s.parent && known.has(s.parent) && s.parent !== s.slug ? s.parent : null);
  }
  // Цикл: идём вверх от каждого раздела; вернулись в него - рвём связь у него.
  for (const s of sections) {
    const seen = new Set<string>([s.slug]);
    let at = parent.get(s.slug) ?? null;
    while (at) {
      if (seen.has(at)) {
        parent.set(s.slug, null);
        break;
      }
      seen.add(at);
      at = parent.get(at) ?? null;
    }
  }
  return parent;
}

/** Путь от верхнего раздела до заданного - для крошек; чужой слаг - пусто. */
export function sectionPath(
  sections: readonly SectionLink[],
  slug: string,
): { readonly slug: string; readonly title: string }[] {
  const bySlug = new Map(sections.map((s) => [s.slug, s]));
  const parent = parentsOf(sections);
  const path: { slug: string; title: string }[] = [];
  let at: string | null = bySlug.has(slug) ? slug : null;
  while (at) {
    const s = bySlug.get(at)!;
    path.unshift({ slug: s.slug, title: s.title });
    at = parent.get(at) ?? null;
  }
  return path;
}

/** Предки раздела снизу вверх, без него самого. */
export function ancestorsOf(sections: readonly SectionLink[], slug: string): string[] {
  return sectionPath(sections, slug)
    .slice(0, -1)
    .map((s) => s.slug)
    .reverse();
}

/**
 * Дерево разделов со счётом позиций.
 *
 * @param own - позиций прямо в разделе, без подразделов.
 * @remarks Ветка без единой позиции в дерево не попадает: идти в неё незачем.
 */
export function sectionTree(
  sections: readonly SectionLink[],
  own: ReadonlyMap<string, number>,
): SectionNode[] {
  const parent = parentsOf(sections);
  const build = (s: SectionLink): SectionNode => {
    const children = sections.filter((c) => parent.get(c.slug) === s.slug).map(build);
    const count = (own.get(s.slug) ?? 0) + children.reduce((n, c) => n + c.count, 0);
    return {
      slug: s.slug,
      title: s.title,
      ...(s.image ? { image: s.image } : {}),
      count,
      children: children.filter((c) => c.count > 0),
    };
  };
  return sections
    .filter((s) => (parent.get(s.slug) ?? null) === null)
    .map(build)
    .filter((n) => n.count > 0);
}

/** Узел раздела в дереве; нет такого или он пуст - null. */
export function findNode(tree: readonly SectionNode[], slug: string): SectionNode | null {
  for (const node of tree) {
    if (node.slug === slug) return node;
    const inner = findNode(node.children, slug);
    if (inner) return inner;
  }
  return null;
}
