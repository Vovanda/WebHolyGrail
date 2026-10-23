import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { cardSpecs, formatMoney, type MediaRef, moneyDecimal, shopSettings } from 'contracts';

import { Breadcrumbs, type Crumb } from '@/blocks/primitives/Breadcrumbs';
import { Gallery } from '@/blocks/primitives/Gallery';
import { MediaImage } from '@/blocks/primitives/Media';
import { hasLexicalContent, LexicalRenderer } from '@/blocks/primitives/RichText';
import { AddToCart } from '@/blocks/primitives/Shop/AddToCart';
import { getOffer, getSiteSettings } from '@/lib/api-client.engine';
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

  const files = [offer.image, ...offer.gallery].filter(Boolean) as MediaRef[];
  const specs = cardSpecs(offer.characteristics, offer.specs);
  const sold = offer.stock !== null && offer.stock <= 0;
  const crumbs: Crumb[] = [
    { label: 'Главная', href: '/' },
    ...(offer.section && offer.sectionTitle
      ? [{ label: offer.sectionTitle, href: `/shop/${offer.section}` }]
      : []),
    { label: offer.title },
  ];

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Breadcrumbs items={crumbs} copyLink />
        <div
          data-part="offer"
          className={
            files.length > 0
              ? 'grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'
              : 'grid max-w-2xl gap-8'
          }
        >
          {files.length > 0 && (
            <div data-part="offer-gallery" className="min-w-0">
              {/* Первый кадр крупно и открывается по нажатию; остальные плиткой под ним. */}
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface">
                <MediaImage
                  media={files[0]!}
                  place="(max-width: 768px) 100vw, 640px"
                  alt={offer.title}
                  className="h-full w-full object-contain"
                />
              </div>
              {files.length > 1 && (
                <div className="mt-4">
                  <Gallery
                    node={{
                      id: `offer-${offer.id}`,
                      blockType: 'gallery',
                      data: { files: files.slice(1), view: 'tiles' },
                    }}
                    {...(settings ? { settings } : {})}
                  />
                </div>
              )}
            </div>
          )}

          <div data-part="offer-buy" className="flex flex-col gap-4">
            <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
              {offer.title}
            </h1>
            {offer.summary && <p className="text-muted">{offer.summary}</p>}
            <p
              data-part="offer-price"
              className="font-display text-3xl font-semibold tabular-nums text-ink"
            >
              {offer.price ? formatMoney(offer.price) : 'Цена по запросу'}
            </p>
            {offer.price && offer.deposit && (
              <p className="text-sm text-muted">Бронь {formatMoney(offer.deposit)} вперёд</p>
            )}
            {sold && <p className="text-sm text-muted">Нет в наличии</p>}
            {offer.price && !sold && (
              <div className="max-w-xs">
                <AddToCart
                  offer={offer.id}
                  snapshot={offer}
                  title={offer.title}
                  available={offer.stock}
                  cartHref={shopSettings(settings?.shop).cartHref}
                  label={offer.howToBuy === 'request' ? 'Оставить заявку' : 'В корзину'}
                />
              </div>
            )}

            {specs.length > 0 && (
              <dl
                data-part="offer-specs"
                className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm"
              >
                {specs.map((s) => (
                  <div key={s.key} className="contents">
                    <dt className="text-muted">{s.title}</dt>
                    <dd className="text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {hasLexicalContent(offer.description) && (
          <div data-part="offer-description" className="mt-10 max-w-prose">
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">Описание</h2>
            <LexicalRenderer value={offer.description} settings={settings ?? undefined} />
          </div>
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
