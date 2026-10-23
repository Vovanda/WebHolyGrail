import {
  applyFilter,
  type CatalogSectionSummary,
  type Characteristic,
  facetsOf,
  type Facet,
  type FilterState,
  pageOf,
  readFilter,
  readPage,
  readSort,
  SHOP_CHARACTERISTICS,
  searchItems,
  type SortKey,
  sortItems,
  withShopCharacteristics,
} from 'contracts';

import type { CatalogEntry, CatalogSnapshot } from './catalog-index';

/** Сколько позиций раздела в превью на `/shop`. */
export const PREVIEW_SIZE = 5;

type Params = Readonly<Record<string, string | readonly string[] | undefined>>;

/** Выдача по индексу: страница позиций, фасеты и превью разделов. */
export interface CatalogAnswer {
  readonly section: CatalogSnapshot['sections'][number] | null;
  readonly characteristics: readonly Characteristic[];
  readonly facets: readonly Facet[];
  readonly entries: readonly CatalogEntry[];
  readonly page: number;
  readonly pages: number;
  readonly total: number;
  readonly sort: SortKey;
  readonly state: FilterState;
  readonly previews: readonly {
    readonly section: CatalogSectionSummary;
    readonly entries: readonly CatalogEntry[];
  }[];
}

/**
 * Выдача каталога по параметрам адреса (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Раздел задан - его позиции и его характеристики вместе с общими; не задан -
 * весь магазин и только общие (наличие, скидка, цена). Порядок: поиск по запросу
 * (релевантность становится порядком «по умолчанию»), фасеты по найденному,
 * фильтр, сортировка, страница. Позиция без цены в выдачу идёт - на карточке
 * «цена по запросу».
 *
 * Превью разделов считаются только для `/shop` без запроса и условий. Неизвестный
 * раздел - `null`: обработчик отвечает 404.
 */
export function queryCatalog(
  snapshot: CatalogSnapshot,
  sectionSlug: string | null,
  params: Params,
): CatalogAnswer | null {
  const section = sectionSlug
    ? (snapshot.sections.find((s) => s.slug === sectionSlug) ?? null)
    : null;
  if (sectionSlug && !section) return null;

  const characteristics = section
    ? withShopCharacteristics(section.characteristics)
    : [...SHOP_CHARACTERISTICS];
  const pool = section ? (snapshot.bySection.get(section.slug) ?? []) : snapshot.entries;

  const raw = params['q'];
  const query = (typeof raw === 'string' ? raw : (raw?.[0] ?? '')).trim().slice(0, 100);
  const found = query ? searchEntries(pool, query) : pool;

  const state = readFilter(params, characteristics);
  const items = found.map((e) => e.item);
  const facets = facetsOf(items, state, characteristics);
  const keep = new Set(applyFilter(items, state, characteristics).map((i) => i.id));
  const filtered = found.filter((e) => keep.has(e.card.id));

  const sort = readSort(params['sort']);
  const sorted = sortItems(filtered, sort, {
    price: (e) => e.price,
    discount: (e) => e.discount,
    created: (e) => e.created,
  });
  const page = pageOf(sorted, readPage(params['page']));

  const bare = !section && !query && Object.keys(state).length === 0;
  const previews = bare
    ? snapshot.sections
        .map((s) => ({ s, list: snapshot.bySection.get(s.slug) ?? [] }))
        .filter(({ list }) => list.length > 0)
        .map(({ s, list }) => ({
          section: { slug: s.slug, title: s.title, description: s.description, count: list.length },
          entries: list.slice(0, PREVIEW_SIZE),
        }))
    : [];

  return {
    section,
    characteristics,
    facets,
    entries: page.items,
    page: page.page,
    pages: page.pages,
    total: page.total,
    sort,
    state,
    previews,
  };
}

/** Поиск по позициям индекса тем же правилом, что раздел каталога и корзина. */
function searchEntries(pool: readonly CatalogEntry[], query: string): CatalogEntry[] {
  const byId = new Map(pool.map((e) => [e.card.id, e]));
  return searchItems(
    pool.map((e) => e.item),
    query,
  ).flatMap((item) => {
    const entry = byId.get(item.id);
    return entry ? [entry] : [];
  });
}
