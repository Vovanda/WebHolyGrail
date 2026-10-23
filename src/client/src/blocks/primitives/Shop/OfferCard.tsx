import type { MediaRef, OfferView } from 'contracts';
import { discountPercent, formatMoney } from 'contracts';

import { CopyCode } from '@/blocks/primitives/CopyCode';
import { MediaImage } from '@/blocks/primitives/Media';

import { AddToCart } from './AddToCart';

/** Наличие одной строкой: покупатель видит, можно ли взять и сколько. */
function availability(offer: OfferView, gone: boolean) {
  if (gone) return { state: 'sold-out', text: 'Нет в наличии' } as const;
  if (offer.howToBuy === 'request') return { state: 'request', text: 'По заявке' } as const;
  if (typeof offer.stock === 'number') {
    return { state: 'in-stock', text: `В наличии: ${offer.stock} шт.` } as const;
  }
  return { state: 'in-stock', text: 'В наличии' } as const;
}

/**
 * Карточка позиции в плитке: витрина и раздел каталога рисуют её одинаково.
 *
 * @remarks
 * Рисуется на сервере (R14); живые только кнопка корзины и копирование артикула.
 * Есть адрес позиции - картинка и название ведут на её страницу `/shop/item/<слаг>`.
 *
 * Карточка мелкая, четыре в ряд: сверху фото, под ним цена - главное, что ищет
 * глаз; название в две строки, артикул, наличие и кнопка внизу, на одном месте
 * у всех карточек ряда. Без картинки верх занимает название крупным шрифтом:
 * высота совпадает с соседями, и заглушки «фото скоро» нет.
 *
 * Части размечены `data-part` - вид меняется в «Виде блока».
 */
export function OfferCard({
  offer,
  cartHref,
}: {
  readonly offer: OfferView;
  readonly cartHref: string;
}) {
  const image = typeof offer.image === 'object' && offer.image ? (offer.image as MediaRef) : null;
  const price = offer.price;
  const stock = typeof offer.stock === 'number' ? offer.stock : null;
  const gone = stock !== null && stock <= 0;
  const href = offer.slug ? `/shop/item/${offer.slug}` : null;
  const discount = discountPercent(price, offer.listPrice);
  const stockLine = availability(offer, gone);
  const title = href ? <a href={href}>{offer.title}</a> : offer.title;
  const picture = image ? (
    <MediaImage
      media={image}
      place="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
      alt=""
      zoom={false}
      className={`h-full w-full object-cover${gone ? ' opacity-60 grayscale' : ''}`}
    />
  ) : null;
  return (
    <article
      data-part="card"
      data-state={gone ? 'sold-out' : 'available'}
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface"
    >
      {image ? (
        <div data-part="card-media" className="aspect-square overflow-hidden">
          {/* Превью позиции не увеличивается: галерея крупно - на странице позиции. */}
          {href ? (
            <a href={href} aria-hidden="true" tabIndex={-1} className="block h-full">
              {picture}
            </a>
          ) : (
            picture
          )}
        </div>
      ) : (
        <div
          data-part="card-media"
          className="flex aspect-square items-end bg-accent-soft p-3 md:p-4"
        >
          <h3
            data-part="card-title"
            className="line-clamp-4 text-balance font-display text-lg font-semibold leading-tight text-ink md:text-xl"
          >
            {title}
          </h3>
        </div>
      )}
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <div data-part="card-price">
          {price ? (
            <>
              <p className="font-display text-xl font-semibold tracking-tight tabular-nums text-ink md:text-2xl">
                {formatMoney(price)}
              </p>
              {offer.listPrice && (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm tabular-nums">
                  <s data-part="card-list-price" className="text-muted">
                    {formatMoney(offer.listPrice)}
                  </s>
                  {discount !== null && (
                    <span
                      data-part="card-discount"
                      className="rounded bg-danger-soft px-1.5 text-xs font-semibold text-danger"
                    >
                      −{discount}%
                    </span>
                  )}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm font-medium text-muted">Цена по запросу</p>
          )}
        </div>
        {image && (
          <h3
            data-part="card-title"
            className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-ink"
          >
            {title}
          </h3>
        )}
        {offer.summary && (
          <p data-part="card-subtitle" className="mt-1 line-clamp-2 text-xs text-muted">
            {offer.summary}
          </p>
        )}
        {offer.sku && (
          <div className="mt-1.5">
            <CopyCode
              value={offer.sku}
              label="Арт."
              copyLabel={`Скопировать артикул ${offer.sku}`}
            />
          </div>
        )}
        <p
          data-part="card-stock"
          data-state={stockLine.state}
          className={`mt-1.5 flex items-center gap-1.5 text-xs ${
            stockLine.state === 'in-stock' ? 'text-success' : 'text-muted'
          }`}
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
          {stockLine.text}
        </p>
        <div className="mt-auto pt-3">
          {price && offer.deposit && (
            <p data-part="card-caption" className="mb-2 text-xs text-muted">
              Бронь {formatMoney(offer.deposit)} вперёд
            </p>
          )}
          {price && !gone && (
            <AddToCart
              offer={offer.id}
              snapshot={offer}
              title={offer.title}
              available={stock}
              cartHref={cartHref}
              label={offer.howToBuy === 'request' ? 'Оставить заявку' : 'В корзину'}
            />
          )}
        </div>
      </div>
    </article>
  );
}
