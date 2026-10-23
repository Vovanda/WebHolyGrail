import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  applyFilter,
  CATALOG_HREF,
  catalogItemOf,
  facetsOf,
  type OfferView,
  readFilter,
  SHOP_CHARACTERISTICS,
  searchItems,
  shopSettings,
} from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { CatalogView } from '@/blocks/primitives/Shop/CatalogView';
import { OfferCard } from '@/blocks/primitives/Shop/OfferCard';
import { getSiteSettings, listCatalogSections, listOffers } from '@/lib/api-client.engine';
import { rangesFromForm } from '@/lib/shop/catalog-href';

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: shopSettings(settings?.shop).menuTitle };
}

/** Склонение «позиция» по числу: 1 позиция, 3 позиции, 5 позиций. */
const positions = (n: number): string => {
  const d = n % 10;
  const dd = n % 100;
  const word =
    d === 1 && dd !== 11
      ? 'позиция'
      : d >= 2 && d <= 4 && (dd < 12 || dd > 14)
        ? 'позиции'
        : 'позиций';
  return `${n} ${word}`;
};

/** Сколько карточек раздела стоит на `/shop`: ровно один ряд плитки. */
const PREVIEW = 5;

/**
 * Магазин целиком `/shop`: поиск и фильтры по всем позициям, ниже разделы блоками.
 *
 * @remarks
 * Сверху то же, что в разделе (`CatalogView`), только условия общие для всех
 * разделов: наличие, скидка, цена. Без условий каждый раздел - блок: заголовок
 * со счётом, ряд карточек и «Все N позиций»; задан запрос или фильтр - общая
 * выдача по магазину. Разделов нет - все позиции плиткой. Пункт меню на эту
 * страницу появляется сам, пока магазин включён (`siteNav`).
 */
export default async function CatalogPage({
  searchParams,
}: {
  readonly searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const characteristics = SHOP_CHARACTERISTICS;
  const canonical = rangesFromForm(search, characteristics);
  if (canonical !== null) redirect(canonical ? `${CATALOG_HREF}?${canonical}` : CATALOG_HREF);

  const query = typeof search['q'] === 'string' ? search['q'].trim().slice(0, 100) : '';
  const state = readFilter(search, characteristics);
  const [settings, sections, loose] = await Promise.all([
    getSiteSettings(),
    listCatalogSections(),
    listOffers({ limit: 100 }),
  ]);
  const bySection = await Promise.all(sections.map((s) => listOffers({ section: s.slug })));
  const shop = shopSettings(settings?.shop);

  // Позиции разделов целиком и те, что вне разделов, - без повторов.
  const pool = new Map<number, OfferView>();
  for (const o of [...bySection.flat(), ...loose]) pool.set(o.id, o);
  const items = [...pool.values()].map(catalogItemOf);
  const found = query ? searchItems(items, query) : items;
  const facets = facetsOf(found, state, characteristics);
  const shown = applyFilter(found, state, characteristics);
  const flat = query !== '' || Object.keys(state).length > 0 || sections.length === 0;

  const tiles = (list: readonly OfferView[]) => (
    <CardRows
      as="ul"
      items={list}
      columns={5}
      columnsMd={3}
      columnsSm={2}
      gap="sm"
      keepColumns
      evenRows={false}
      fullRows
    >
      {(offer) => <OfferCard offer={offer} cartHref={shop.cartHref} />}
    </CardRows>
  );

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: shop.menuTitle }]} />
        <h1 data-part="title" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {shop.menuTitle}
        </h1>

        <CatalogView
          basePath={CATALOG_HREF}
          query={query}
          state={state}
          characteristics={characteristics}
          facets={facets}
          found={flat ? shown.length : null}
          searchLabel="Поиск по магазину"
        >
          {flat ? (
            tiles(shown)
          ) : (
            <div data-part="sections" className="grid gap-12 pt-2">
              {sections.map((s, i) => (
                <section key={s.slug} data-part="section-block">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">
                      <a href={`${CATALOG_HREF}/${s.slug}`} className="hover:text-accent">
                        {s.title}
                      </a>
                    </h2>
                    <a
                      href={`${CATALOG_HREF}/${s.slug}`}
                      data-part="section-all"
                      className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                    >
                      Все {positions(s.count)}
                    </a>
                  </div>
                  {tiles((bySection[i] ?? []).slice(0, PREVIEW))}
                </section>
              ))}
            </div>
          )}
        </CatalogView>
      </div>
    </section>
  );
}
