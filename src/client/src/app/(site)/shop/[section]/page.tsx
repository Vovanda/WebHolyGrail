import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import {
  applyFilter,
  CATALOG_HREF,
  catalogItemOf,
  facetsOf,
  readFilter,
  searchItems,
  shopSettings,
  withShopCharacteristics,
} from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { CatalogView } from '@/blocks/primitives/Shop/CatalogView';
import { OfferCard } from '@/blocks/primitives/Shop/OfferCard';
import { getCatalogSection, getSiteSettings, listOffers } from '@/lib/api-client.engine';
import { rangesFromForm } from '@/lib/shop/catalog-href';

/**
 * Раздел каталога `/shop/<слаг>`: поиск, фильтр по характеристикам и плитка позиций.
 *
 * @remarks
 * Состояние - в адресе (R13): `?material=pvc&thickness=1.2..2&q=клей`. Фильтр и
 * поиск считаются на сервере по позициям раздела: каталоги наших сайтов - сотни
 * позиций, отдельный сервис поиска не нужен (R7, 44-catalog-search.md). Без JS
 * страница работает целиком: значения фильтра - ссылки, диапазон и поиск - формы.
 */
type Params = { section: string };
type Search = Record<string, string | string[] | undefined>;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const section = await getCatalogSection((await params).section);
  if (!section) return {};
  return {
    title: section.title,
    description: section.description ?? undefined,
    alternates: { canonical: `/shop/${section.slug}` },
  };
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ section: slug }, search] = await Promise.all([params, searchParams]);
  const section = await getCatalogSection(slug);
  if (!section) notFound();
  const basePath = `/shop/${section.slug}`;
  // Наличие, скидка и цена - общие для магазина, затем характеристики раздела.
  const characteristics = withShopCharacteristics(section.characteristics);

  // Форма диапазона присылает `ключ.min` и `ключ.max` - приводим к `ключ=от..до`.
  const canonical = rangesFromForm(search, characteristics);
  if (canonical !== null) redirect(canonical ? `${basePath}?${canonical}` : basePath);

  const [offers, settings] = await Promise.all([
    listOffers({ section: section.slug }),
    getSiteSettings(),
  ]);
  const shop = shopSettings(settings?.shop);
  const query = typeof search['q'] === 'string' ? search['q'].trim().slice(0, 100) : '';
  const state = readFilter(search, characteristics);
  const items = offers.map(catalogItemOf);
  const found = query ? searchItems(items, query) : items;
  const facets = facetsOf(found, state, characteristics);
  const shown = applyFilter(found, state, characteristics);

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: shop.menuTitle, href: CATALOG_HREF },
            { label: section.title },
          ]}
        />
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {section.title}
        </h1>
        {section.description && (
          <p className="mt-2 max-w-content text-muted">{section.description}</p>
        )}

        <CatalogView
          basePath={basePath}
          query={query}
          state={state}
          characteristics={characteristics}
          facets={facets}
          found={shown.length}
          searchLabel={`Поиск в разделе «${section.title}»`}
        >
          <CardRows
            as="ul"
            items={shown}
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
        </CatalogView>
      </div>
    </section>
  );
}
