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
  searchIndex,
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
  // Тот же снимок и те же параметры - тот же ответ: популярные подборки не считаются заново.
  const key = `${sectionSlug ?? ''}?${new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : (Array.isArray(v) ? v : [v]).map((x) => [k, String(x)]),
    ),
  ).toString()}`;
  let cache = answers.get(snapshot);
  if (!cache) answers.set(snapshot, (cache = new Map()));
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const answer = computeCatalog(snapshot, sectionSlug, params);
  if (cache.size >= REMEMBERED_ANSWERS) cache.delete(cache.keys().next().value!);
  cache.set(key, answer);
  return answer;
}

/** Сколько ответов помнит один снимок индекса. */
const REMEMBERED_ANSWERS = 300;
const answers = new WeakMap<CatalogSnapshot, Map<string, CatalogAnswer | null>>();

/**
 * Индексы поиска для всего магазина и каждого раздела - заранее, в фоновой
 * сборке снимка: первый покупатель с запросом не ждёт их построения.
 */
export function prepareSearch(snapshot: CatalogSnapshot): void {
  searchIndex(preparedOf(snapshot.entries).items);
  for (const pool of snapshot.bySection.values()) searchIndex(preparedOf(pool).items);
}

function computeCatalog(
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
  const items = query ? found.map((e) => e.item) : preparedOf(found).items;
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

/** Позиции набора и их номера - один раз на набор: на них держится кеш индекса поиска. */
const prepared = new WeakMap<
  readonly CatalogEntry[],
  { items: readonly CatalogEntry['item'][]; byId: ReadonlyMap<number, CatalogEntry> }
>();
function preparedOf(pool: readonly CatalogEntry[]) {
  let ready = prepared.get(pool);
  if (!ready) {
    ready = { items: pool.map((e) => e.item), byId: new Map(pool.map((e) => [e.card.id, e])) };
    prepared.set(pool, ready);
  }
  return ready;
}

/** Поиск по позициям индекса тем же правилом, что раздел каталога и корзина. */
export function searchEntries(pool: readonly CatalogEntry[], query: string): CatalogEntry[] {
  const { items, byId } = preparedOf(pool);
  return searchItems(items, query).flatMap((item) => {
    const entry = byId.get(item.id);
    return entry ? [entry] : [];
  });
}
