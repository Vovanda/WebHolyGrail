import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  CATALOG_HREF,
  cardSpecs,
  discountPercent,
  formatMoney,
  type MediaRef,
  moneyDecimal,
  offerViewOf,
  shopSettings,
} from 'contracts';

import { Breadcrumbs, type Crumb } from '@/blocks/primitives/Breadcrumbs';
import { Collapsible } from '@/blocks/primitives/Collapsible';
import { CopyCode } from '@/blocks/primitives/CopyCode';
import { OfferGallery } from '@/blocks/primitives/Shop/OfferGallery';
import { SpecTable } from '@/blocks/primitives/Shop/SpecTable';

import { hasLexicalContent, LexicalRenderer } from '@/blocks/primitives/RichText';
import { AddToCart } from '@/blocks/primitives/Shop/AddToCart';
import { OfferLane } from '@/blocks/primitives/Shop/OfferLane';
import { ShopTopBar } from '@/blocks/primitives/Shop/ShopTopBar';
import { getCatalog, getOffer, getSiteSettings } from '@/lib/api-client.engine';
import { jsonLd } from '@/lib/seo/json-ld';

/**
 * Страница позиции `/shop/item/<слаг>`: галерея, цена, корзина, характеристики, описание.
 *
 * @remarks
 * Адрес не зависит от раздела: позицию переносят между разделами, а ссылки на
 * неё, разосланные и проиндексированные, продолжают работать (R13). Раздел
 * виден в крошках и ведёт в свой каталог.
 *
 * Характеристики - строки раздела по его порядку, только заполненные
 * (`cardSpecs`). Первая картинка - крупно, остальные - блоком «Галерея»
 * плиткой; кадр открывается крупно по нажатию.
 */
type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const offer = await getOffer((await params).slug);
  if (!offer) return {};
  return {
    title: offer.title,
    description: offer.summary ?? undefined,
    alternates: { canonical: `/shop/item/${offer.slug}` },
  };
}

export default async function OfferPage({ params }: { params: Promise<Params> }) {
  const [offer, settings] = await Promise.all([getOffer((await params).slug), getSiteSettings()]);
  if (!offer) notFound();
  // Путь до раздела и дерево каталога - из той же ручки, что выдача.
  const place = await getCatalog(offer.section, { page: '1' });

  const files = [offer.image, ...offer.gallery].filter(Boolean) as MediaRef[];
  const groupOf = new Map(offer.characteristics.map((c) => [c.key, c.group ?? null]));
  const specs = cardSpecs(offer.characteristics, offer.specs).map((s) => ({
    ...s,
    group: groupOf.get(s.key) ?? null,
  }));
  const discount = discountPercent(offer.price, offer.listPrice);
  const sold = offer.stock !== null && offer.stock <= 0;
  const crumbs: Crumb[] = [
    { label: 'Главная', href: '/' },
    { label: shopSettings(settings?.shop).menuTitle, href: CATALOG_HREF },
    ...(place?.path ?? []).map((s) => ({ label: s.title, href: `${CATALOG_HREF}/${s.slug}` })),
    { label: offer.title },
  ];

  const cartHref = shopSettings(settings?.shop).cartHref;

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <ShopTopBar tree={place?.tree ?? []} current={(place?.path ?? []).map((s) => s.slug)} />
        <Breadcrumbs items={crumbs} copyLink />
        <h1 className="font-display text-2xl font-semibold leading-tight text-ink md:text-3xl">
          {offer.title}
        </h1>
        {offer.sku && (
          <p className="mt-2 text-sm text-muted">
            <CopyCode
              value={offer.sku}
              label="Артикул"
              copyLabel={`Скопировать артикул ${offer.sku}`}
            />
          </p>
        )}

        {/* Три зоны, как у Озона и ВсеИнструменты: фото, ключевые характеристики, цена. */}
        <div
          data-part="offer"
          className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_20rem]"
        >
          <OfferGallery files={files} title={offer.title} />

          <div data-part="offer-key" className="order-3 lg:order-none">
            {offer.summary && <p className="mb-4 text-sm text-muted">{offer.summary}</p>}
            {specs.length > 0 && (
              <>
                <h2 className="mb-3 font-display text-base font-semibold text-ink">О товаре</h2>
                <SpecTable rows={specs.slice(0, 6).map((r) => ({ ...r, group: null }))} />
                {specs.length > 6 && (
                  <a
                    href="#specs"
                    className="mt-3 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Все характеристики ›
                  </a>
                )}
              </>
            )}
          </div>

          <aside
            data-part="offer-buy"
            className="order-2 self-start rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:order-none"
          >
            {offer.price && offer.listPrice && (
              <p className="flex flex-wrap items-center gap-2 text-sm tabular-nums">
                <s data-part="offer-list-price" className="text-muted">
                  {formatMoney(offer.listPrice)}
                </s>
                {discount !== null && (
                  <span className="rounded-md bg-success px-1.5 py-0.5 text-xs font-medium text-accent-fg">
                    −{discount}%
                  </span>
                )}
              </p>
            )}
            <p
              data-part="offer-price"
              className="mt-1 font-display text-3xl font-bold tabular-nums text-ink"
            >
              {offer.price ? formatMoney(offer.price) : 'Цена по запросу'}
            </p>
            {offer.price && offer.deposit && (
              <p className="mt-1 text-sm text-muted">Бронь {formatMoney(offer.deposit)} вперёд</p>
            )}
            {offer.price && !sold && (
              <div className="mt-4">
                <AddToCart
                  offer={offer.id}
                  snapshot={offerViewOf(offer)}
                  title={offer.title}
                  available={offer.stock}
                  cartHref={cartHref}
                  label={offer.howToBuy === 'request' ? 'Оставить заявку' : 'В корзину'}
                />
              </div>
            )}
            <p
              data-part="offer-stock"
              className={`mt-4 text-sm ${sold ? 'text-muted' : 'text-success'}`}
            >
              {sold
                ? 'Нет в наличии'
                : offer.howToBuy === 'request'
                  ? 'По заявке: наличие подтвердит продавец'
                  : typeof offer.stock === 'number'
                    ? `В наличии: ${offer.stock} шт.`
                    : 'В наличии'}
            </p>
          </aside>
        </div>

        {/* Описание и все характеристики - двумя колонками, обе свёрнуты. */}
        {(hasLexicalContent(offer.description) || specs.length > 0) && (
          <div className="mt-12 grid gap-10 border-t border-border pt-10 lg:grid-cols-2">
            {hasLexicalContent(offer.description) && (
              <section data-part="offer-description">
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">Описание</h2>
                <Collapsible height={280}>
                  <LexicalRenderer value={offer.description} settings={settings ?? undefined} />
                </Collapsible>
              </section>
            )}
            {specs.length > 0 && (
              <section
                id="specs"
                data-part="offer-specs"
                className={`scroll-mt-24 ${hasLexicalContent(offer.description) ? '' : 'lg:col-span-2'}`}
              >
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">Характеристики</h2>
                <Collapsible height={320} more="Все характеристики">
                  {/* Описания нет - таблица во всю ширину, группы в две колонки. */}
                  <SpecTable rows={specs} columns={hasLexicalContent(offer.description) ? 1 : 2} />
                </Collapsible>
              </section>
            )}
          </div>
        )}

        {(
          [
            ['similar', 'Похожие', offer.similar],
            ['together', 'С этим часто берут', offer.together],
          ] as const
        ).map(
          ([part, title, items]) =>
            items.length > 0 && (
              <section key={part} data-part={`offer-${part}`} className="mt-12 min-w-0">
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">{title}</h2>
                <OfferLane
                  head={items}
                  cartHref={cartHref}
                  reverse={part === 'together'}
                  delay={part === 'together' ? 4600 : 3800}
                  label={title}
                />
              </section>
            ),
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: offer.title,
            ...(offer.summary ? { description: offer.summary } : {}),
            ...(offer.price
              ? {
                  offers: {
                    '@type': 'Offer',
                    price: moneyDecimal(offer.price),
                    priceCurrency: offer.price.currency,
                    availability: sold
                      ? 'https://schema.org/OutOfStock'
                      : 'https://schema.org/InStock',
                  },
                }
              : {}),
          }),
        }}
      />
    </section>
  );
}
