import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CATALOG_HREF, searchItems, shopSettings } from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { OfferCard } from '@/blocks/primitives/Shop/OfferCard';
import { getSiteSettings, listCatalogSections, listOffers } from '@/lib/api-client.engine';

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

/**
 * Вход в каталог `/shop`: поиск по всему магазину и разделы.
 *
 * @remarks
 * Путь покупателя короткий: раздел один - сразу его позиции, разделов нет - все
 * позиции витриной, есть запрос - найденное по всему каталогу. Пункт меню на эту
 * страницу появляется сам, пока магазин включён (`siteNav`).
 */
export default async function CatalogPage({
  searchParams,
}: {
  readonly searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const query = typeof search['q'] === 'string' ? search['q'].trim().slice(0, 100) : '';
  const [settings, sections] = await Promise.all([getSiteSettings(), listCatalogSections()]);
  if (!query && sections.length === 1) redirect(`${CATALOG_HREF}/${sections[0]!.slug}`);

  const shop = shopSettings(settings?.shop);
  const offers = query || sections.length === 0 ? await listOffers({ limit: 100 }) : [];
  const shown = query ? searchItems(offers, query) : offers;

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-content px-4 md:px-6">
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: shop.menuTitle }]} />
        <h1
          data-part="title"
          className="mt-4 font-display text-2xl font-semibold text-ink md:text-3xl"
        >
          {shop.menuTitle}
        </h1>

        <form action={CATALOG_HREF} className="mt-6 flex max-w-xl gap-2" data-part="search">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Поиск по каталогу"
            className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-fg hover:opacity-90"
          >
            Найти
          </button>
        </form>

        {query || sections.length === 0 ? (
          <div className="mt-6">
            {query && (
              <p data-part="result-count" className="mb-4 text-sm text-muted">
                {shown.length > 0
                  ? `Найдено: ${shown.length}`
                  : 'Ничего не нашлось - смягчите запрос.'}
              </p>
            )}
            {shown.length > 0 && (
              <CardRows as="ul" items={shown} columns={3} gap="md" keepColumns>
                {(offer) => <OfferCard offer={offer} cartHref={shop.cartHref} />}
              </CardRows>
            )}
          </div>
        ) : (
          <div className="mt-8" data-part="sections">
            <CardRows as="ul" items={sections} columns={3} gap="md" keepColumns>
              {(s) => (
                <a
                  href={`${CATALOG_HREF}/${s.slug}`}
                  data-part="section-card"
                  className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
                >
                  <span className="font-display text-lg font-semibold text-ink">{s.title}</span>
                  {s.description && (
                    <span className="mt-1 line-clamp-3 text-sm text-muted">{s.description}</span>
                  )}
                  <span className="mt-auto pt-4 text-sm text-accent">{positions(s.count)}</span>
                </a>
              )}
            </CardRows>
          </div>
        )}
      </div>
    </section>
  );
}
