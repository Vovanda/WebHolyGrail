'use client';

import { CATALOG_HREF, type SectionNode } from 'contracts';
import Link from 'next/link';

import { SidePanel } from '../SidePanel';

/**
 * Панель «Каталог» справа: дерево разделов со счётом позиций.
 *
 * @remarks
 * Боковая панель сдвигает страницу (`SidePanel`, push), как фильтр слева -
 * фильтры слева, каталог справа. Ветки раскрываются на месте, путь до текущего
 * раздела раскрыт сразу, сам раздел отмечен. Переход по разделу - ссылка.
 *
 * Части: `catalog-toggle` - кнопка, `catalog-tree` - дерево, `catalog-node` - раздел.
 */
export function CatalogTree({
  tree,
  current,
}: {
  readonly tree: readonly SectionNode[];
  /** Путь до текущего раздела - раскрыт и отмечен. */
  readonly current?: readonly string[] | undefined;
}) {
  if (tree.length === 0) return null;
  const open = new Set(current ?? []);
  const here = current?.[current.length - 1];
  return (
    <SidePanel
      side="right"
      width="min(22rem, 88vw)"
      title="Каталог"
      trigger={({ open: show, isOpen }) => (
        <button
          type="button"
          onClick={show}
          data-part="catalog-toggle"
          aria-expanded={isOpen}
          aria-label="Каталог"
          className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-border-strong px-3 sm:px-4 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 6h16M4 12h16M4 18h10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {/* На узком экране - одна иконка: строке поиска нужна ширина. */}
          <span className="hidden sm:inline">Каталог</span>
        </button>
      )}
    >
      <nav data-part="catalog-tree" aria-label="Разделы каталога">
        <Nodes nodes={tree} open={open} here={here} depth={0} />
      </nav>
    </SidePanel>
  );
}

function Nodes({
  nodes,
  open,
  here,
  depth,
}: {
  readonly nodes: readonly SectionNode[];
  readonly open: ReadonlySet<string>;
  readonly here: string | undefined;
  readonly depth: number;
}) {
  return (
    <ul className={depth > 0 ? 'ml-3 border-l border-border pl-2' : ''}>
      {nodes.map((node) => {
        const link = (
          <Link
            href={`${CATALOG_HREF}/${node.slug}`}
            data-part="catalog-node"
            aria-current={node.slug === here ? 'page' : undefined}
            className={`flex min-h-10 flex-1 items-center justify-between gap-3 rounded-md px-2 text-sm transition-colors hover:bg-surface-hover ${
              node.slug === here ? 'font-semibold text-accent' : 'text-ink'
            }`}
          >
            <span>{node.title}</span>
            <span className="tabular-nums text-muted">{node.count}</span>
          </Link>
        );
        return (
          <li key={node.slug}>
            {node.children.length > 0 ? (
              <details open={open.has(node.slug)} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden="true"
                    className="w-4 shrink-0 text-center text-muted transition-transform group-open:rotate-90"
                  >
                    ›
                  </span>
                  {link}
                </summary>
                <Nodes nodes={node.children} open={open} here={here} depth={depth + 1} />
              </details>
            ) : (
              <div className="flex items-center gap-1">
                <span className="w-4 shrink-0" aria-hidden="true" />
                {link}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
