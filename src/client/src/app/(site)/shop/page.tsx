import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CATALOG_HREF, readFilter, shopSettings } from 'contracts';

import Link from 'next/link';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { CatalogView } from '@/blocks/primitives/Shop/CatalogView';
import { OfferCard } from '@/blocks/primitives/Shop/OfferCard';
import { ShopSearchBar } from '@/blocks/primitives/Shop/ShopSearchBar';
import { getCatalog, getSiteSettings } from '@/lib/api-client.engine';
import { rangesFromForm } from '@/lib/shop/catalog-href';
import { positions } from '@/lib/shop/positions';

type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: shopSettings(settings?.shop).menuTitle };
}

/**
 * Магазин целиком `/shop`: поиск и фильтры по всем позициям, ниже разделы блоками.
 *
 * @remarks
 * Сверху то же, что в разделе (`CatalogView`), только условия общие для всех
 * разделов: наличие, скидка, цена. Без условий каждый раздел - блок: заголовок,
 * ряд карточек и «Все N позиций»; задан запрос или фильтр - общая выдача по
 * магазину страницами. Всё приходит одним запросом к индексу каталога
 * (`getCatalog`): превью разделов считает он же. Пункт меню на эту страницу
 * появляется сам, пока магазин включён (`siteNav`).
 */
export default async function CatalogPage({
  searchParams,
}: {
  readonly searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const [result, settings] = await Promise.all([getCatalog(null, search), getSiteSettings()]);
  const shop = shopSettings(settings?.shop);
  const characteristics = result?.characteristics ?? [];
  const canonical = rangesFromForm(search, characteristics);
  if (canonical !== null) redirect(canonical ? `${CATALOG_HREF}?${canonical}` : CATALOG_HREF);

  const query = typeof search['q'] === 'string' ? search['q'].trim().slice(0, 100) : '';
  const place = {
    basePath: CATALOG_HREF,
    state: readFilter(search, characteristics),
    characteristics,
    query,
    sort: result?.sort ?? 'default',
  };
  const previews = result?.previews ?? [];
  const flat = previews.length === 0;

  const tiles = (list: NonNullable<typeof result>['items']) => (
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
        <ShopSearchBar query={query} />
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: shop.menuTitle }]} />
        <h1 data-part="title" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {shop.menuTitle}
        </h1>

        <CatalogView
          place={place}
          facets={result?.facets ?? []}
          result={
            flat && result
              ? {
                  total: result.total,
                  page: result.page,
                  pages: result.pages,
                  shown: result.items.length,
                  sort: result.sort,
                }
              : null
          }
          empty="В магазине пока нет позиций."
        >
          {flat ? (
            result && tiles(result.items)
          ) : (
            <div data-part="sections" className="grid gap-12 pt-2">
              {previews.map(({ section, items }) => (
                <section key={section.slug} data-part="section-block">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">
                      <Link href={`${CATALOG_HREF}/${section.slug}`} className="hover:text-accent">
                        {section.title}
                      </Link>
                    </h2>
                    <Link
                      href={`${CATALOG_HREF}/${section.slug}`}
                      data-part="section-all"
                      className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                    >
                      Все {positions(section.count)}
                    </Link>
                  </div>
                  {tiles(items)}
                </section>
              ))}
            </div>
          )}
        </CatalogView>
      </div>
    </section>
  );
}
