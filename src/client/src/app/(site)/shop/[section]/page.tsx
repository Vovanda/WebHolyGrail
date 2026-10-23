import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { CATALOG_HREF, readFilter, shopSettings } from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { CatalogView } from '@/blocks/primitives/Shop/CatalogView';
import { OfferCard } from '@/blocks/primitives/Shop/OfferCard';
import { ShopSearchBar } from '@/blocks/primitives/Shop/ShopSearchBar';
import { getCatalog, getCatalogSection, getSiteSettings } from '@/lib/api-client.engine';
import { rangesFromForm } from '@/lib/shop/catalog-href';
import { positions } from '@/lib/shop/positions';

/**
 * Раздел каталога `/shop/<слаг>`: поиск, фильтр по характеристикам и плитка позиций.
 *
 * @remarks
 * Состояние - в адресе (R13): `?material=pvc&thickness=1.2..2&q=клей&sort=&page=`.
 * Выдачу считает индекс каталога в CMS, страница берёт одну её страницу
 * (`getCatalog`) - вес не зависит от числа позиций (44-catalog-search.md). Без JS
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
  const [result, settings] = await Promise.all([getCatalog(slug, search), getSiteSettings()]);
  if (!result?.section) notFound();
  const section = result.section;
  const basePath = `${CATALOG_HREF}/${section.slug}`;

  // Форма диапазона присылает `ключ.min` и `ключ.max` - приводим к `ключ=от..до`.
  const canonical = rangesFromForm(search, result.characteristics);
  if (canonical !== null) redirect(canonical ? `${basePath}?${canonical}` : basePath);

  const shop = shopSettings(settings?.shop);
  const query = typeof search['q'] === 'string' ? search['q'].trim().slice(0, 100) : '';
  const place = {
    basePath,
    state: readFilter(search, result.characteristics),
    characteristics: result.characteristics,
    query,
    sort: result.sort,
  };

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <ShopSearchBar query={query} scope={{ slug: section.slug, title: section.title }} />
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: shop.menuTitle, href: CATALOG_HREF },
            { label: section.title },
          ]}
        />
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
            {section.title}
          </h1>
          <span data-part="title-count" className="text-sm text-muted">
            {positions(result.total)}
          </span>
        </div>
        {section.description && (
          <p className="mt-2 max-w-content text-muted">{section.description}</p>
        )}

        <CatalogView
          place={place}
          facets={result.facets}
          result={{
            total: result.total,
            page: result.page,
            pages: result.pages,
            shown: result.items.length,
            sort: result.sort,
          }}
          empty="В разделе пока нет позиций."
        >
          <CardRows
            as="ul"
            items={result.items}
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
