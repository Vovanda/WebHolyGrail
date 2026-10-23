import type { BlockNode, MediaRef, OfferView, SiteSettings } from 'contracts';
import { formatMoney } from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { MediaImage } from '@/blocks/primitives/Media';
import { listOffers } from '@/lib/api-client.engine';

import { AddToCart } from './AddToCart';

/**
 * Showcase - витрина магазина: плитка позиций с кнопкой «В корзину».
 *
 * @remarks
 * Рисуется на сервере (R14), браузерная только кнопка. Позиции - выбранные в
 * блоке или все по названию; цена приходит `Money` в валюте магазина. Позиция
 * без цены в корзину не кладётся - на карточке «Цена по запросу». Позиция с нулевым остатком
 * остаётся видна с пометкой: щенка уже забрали, но витрина помнит, что он был.
 * Без картинки верх карточки занимает само название крупным шрифтом: высота
 * совпадает с соседями, и пустой заглушки «фото скоро» нет.
 * Главное в карточке - цена; кнопка всегда внизу, на одном месте у всех карточек.
 * Части размечены `data-part` - вид меняется в «Виде блока».
 */
export interface ShowcaseData {
  readonly heading?: string;
  readonly description?: string;
  /** Выбранные позиции; пусто - все. */
  readonly offers?: readonly (number | { readonly id: number })[] | null;
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
  const picked = (data.offers ?? []).map((o) => (typeof o === 'number' ? o : o.id));
  const offers: OfferView[] = await listOffers(picked.length > 0 ? { ids: picked } : { limit: 60 });
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
            const price = offer.price;
            const stock = typeof offer.stock === 'number' ? offer.stock : null;
            const gone = stock !== null && stock <= 0;
            const badge = gone
              ? 'Нет в наличии'
              : offer.howToBuy === 'request'
                ? 'По заявке'
                : null;
            return (
              <article
                data-part="card"
                data-state={gone ? 'sold-out' : 'available'}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface"
              >
                {image ? (
                  <div
                    data-part="card-media"
                    className="aspect-[4/3] overflow-hidden border-b border-border"
                  >
                    <MediaImage
                      media={image}
                      place="(max-width: 768px) 100vw, 360px"
                      alt=""
                      // Превью позиции не увеличивается: галерея с лайтбоксом - в карточке (#178).
                      zoom={false}
                      className={`h-full w-full object-cover${gone ? ' opacity-60 grayscale' : ''}`}
                    />
                  </div>
                ) : (
                  <div
                    data-part="card-media"
                    className="flex aspect-[4/3] items-end border-b border-border bg-accent-soft p-5"
                  >
                    <h3
                      data-part="card-title"
                      className="line-clamp-3 text-balance font-display text-2xl font-semibold leading-tight text-ink"
                    >
                      {offer.title}
                    </h3>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  {badge && (
                    <p
                      data-part="card-badge"
                      className={`mb-3 self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        gone ? 'bg-surface-hover text-muted' : 'bg-accent-soft text-ink'
                      }`}
                    >
                      {badge}
                    </p>
                  )}
                  {image && (
                    <h3
                      data-part="card-title"
                      className="text-balance font-display text-lg font-semibold leading-snug text-ink"
                    >
                      {offer.title}
                    </h3>
                  )}
                  {offer.summary && (
                    <p data-part="card-subtitle" className="mt-1.5 line-clamp-2 text-sm text-muted">
                      {offer.summary}
                    </p>
                  )}
                  <div className="mt-auto pt-5">
                    <p
                      data-part="card-price"
                      className={
                        price
                          ? 'font-display text-2xl font-semibold tracking-tight tabular-nums text-ink'
                          : 'font-medium text-muted'
                      }
                    >
                      {price ? formatMoney(price) : 'Цена по запросу'}
                    </p>
                    {price && offer.deposit && (
                      <p data-part="card-caption" className="mt-0.5 text-sm text-muted">
                        Бронь {formatMoney(offer.deposit)} вперёд
                      </p>
                    )}
                    {price && !gone && (
                      <div className="mt-4">
                        <AddToCart
                          offer={offer.id}
                          available={stock}
                          cartHref={cartHref}
                          label={offer.howToBuy === 'request' ? 'Оставить заявку' : 'В корзину'}
                        />
                      </div>
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
