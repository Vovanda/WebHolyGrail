import type { SectionNode } from 'contracts';

import { CatalogTree } from './CatalogTree';
import { ShopSearchBar } from './ShopSearchBar';

/**
 * Верхняя строка каждой страницы магазина: поиск и кнопка «Каталог» справа
 * (docs/whg/43-shop.md, «Вид страниц магазина»).
 *
 * @remarks
 * Одна и та же на `/shop`, в разделе и на странице товара: покупатель ищет
 * и переходит по разделам из одного места. Части: `shop-top`.
 */
export function ShopTopBar({
  query,
  scope,
  tree,
  current,
}: {
  readonly query?: string;
  readonly scope?: { readonly slug: string; readonly title: string } | undefined;
  readonly tree: readonly SectionNode[];
  /** Путь до текущего раздела - раскрыт в дереве. */
  readonly current?: readonly string[] | undefined;
}) {
  return (
    <div data-part="shop-top" className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <ShopSearchBar query={query ?? ''} scope={scope} />
      </div>
      <CatalogTree tree={tree} current={current} />
    </div>
  );
}
