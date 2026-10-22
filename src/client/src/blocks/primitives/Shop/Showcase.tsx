import type { BlockNode, MediaRef, OfferDoc, SiteSettings } from 'contracts';
import { formatRub } from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { MediaImage } from '@/blocks/primitives/Media';
import { listOffers } from '@/lib/api-client.engine';

import { AddToCart } from './AddToCart';

/**
 * Showcase - витрина магазина: плитка позиций с кнопкой «В корзину».
 *
 * @remarks
 * Рисуется на сервере (R14), браузерная только кнопка. Позиции - выбранные в
 * блоке или все по названию. Цена в базе в рублях, в корзину позиция без цены
 * не кладётся - на карточке «Цена по запросу». Позиция с нулевым остатком
 * остаётся видна с пометкой: щенка уже забрали, но витрина помнит, что он был.
 * Без картинки карточка просто без неё: пустая заглушка заняла бы полкарточки.
 * Части размечены `data-part` - вид меняется в «Виде блока».
 */
export interface ShowcaseData {
  readonly heading?: string;
  readonly description?: string;
  /** Выбранные позиции; пусто - все. */
  readonly offers?: readonly (OfferDoc | number)[] | null;
  readonly cartHref?: string | null;
  readonly tileLayout?: string | null | undefined;
  readonly tileLayoutMd?: string | null | undefined;
  readonly tileLayoutSm?: string | null | undefined;
}

export async function Showcase({
  node,
}: {
  readonly node: BlockNode & { data?: ShowcaseData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const picked = (data.offers ?? []).filter(
    (o): o is OfferDoc => typeof o === 'object' && o !== null,
  );
  const offers = picked.length > 0 ? picked : await listOffers();
  if (offers.length === 0) return null;
  const cartHref = data.cartHref?.trim() || '/cart';

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {data.heading && (
          <h2
            data-part="title"
            className="font-display text-2xl font-semibold text-ink md:text-3xl"
          >
            {data.heading}
          </h2>
        )}
        {data.description && (
          <p data-part="subtitle" className="mt-2 text-muted">
            {data.description}
          </p>
        )}
        <CardRows
          as="ul"
          items={offers}
          columns={3}
          gap="md"
          tileLayout={data.tileLayout}
          tileLayoutMd={data.tileLayoutMd}
          tileLayoutSm={data.tileLayoutSm}
          keepColumns
          className="mt-6"
        >
          {(offer) => {
            const image =
              typeof offer.image === 'object' && offer.image ? (offer.image as MediaRef) : null;
            const priced = typeof offer.price === 'number' && offer.price > 0;
            const stock = typeof offer.stock === 'number' ? offer.stock : null;
            const gone = stock !== null && stock <= 0;
            return (
              <article
                data-part="card"
                data-state={gone ? 'sold-out' : 'available'}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface"
              >
                {image ? (
                  <MediaImage
                    media={image}
                    place="(max-width: 768px) 100vw, 360px"
                    alt=""
                    className="aspect-[4/3] w-full border-b border-border object-cover"
                  />
                ) : null}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 data-part="card-title" className="font-medium text-ink">
                    {offer.title}
                  </h3>
                  {offer.summary && (
                    <p data-part="card-subtitle" className="text-sm text-muted">
                      {offer.summary}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <span data-part="card-price" className="text-lg font-semibold text-ink">
                      {priced ? formatRub(Math.round(offer.price! * 100)) : 'Цена по запросу'}
                    </span>
                    {gone ? (
                      <span data-part="card-caption" className="text-sm text-muted">
                        Нет в наличии
                      </span>
                    ) : (
                      priced && <AddToCart offer={offer.id} available={stock} cartHref={cartHref} />
                    )}
                  </div>
                </div>
              </article>
            );
          }}
        </CardRows>
      </div>
    </section>
  );
}
