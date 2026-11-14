import type { MediaRef, OfferView } from 'contracts';
import { discountPercent, formatMoney } from 'contracts';

import { CopyCode } from '@/blocks/primitives/CopyCode';
import { MediaImage } from '@/blocks/primitives/Media';
import { MediaPlaceholder } from '@/blocks/primitives/Media/MediaPlaceholder';

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
 * Карточка мелкая, пять в ряд, без своей подложки - рамка проступает при
 * наведении: сверху фото, под ним скидка и цена - главное, что ищет глаз;
 * название до трёх строк, артикул справа, внизу наличие и под ним кнопка.
 * Без картинки на месте фото нейтральное поле с иконкой, название стоит там же,
 * где у соседей.
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
  // Фото нет - нейтральное поле с иконкой той же высоты, название стоит на своём месте ниже.
  const media = picture ?? <MediaPlaceholder />;
  return (
    <article
      data-part="card"
      data-state={gone ? 'sold-out' : 'available'}
      className="flex h-full flex-col rounded-2xl border border-transparent bg-bg p-3 transition-colors hover:border-border"
    >
      <div data-part="card-media" className="aspect-square overflow-hidden rounded-xl">
        {/* Превью позиции не увеличивается: галерея крупно - на странице позиции. */}
        {href ? (
          <a href={href} aria-hidden="true" tabIndex={-1} className="block h-full">
            {media}
          </a>
        ) : (
          media
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <div data-part="card-price">
          {price ? (
            <>
              {discount !== null && (
                <span
                  data-part="card-discount"
                  className="mb-1 inline-block rounded-md bg-success px-1.5 py-0.5 text-sm font-medium leading-none text-accent-fg"
                >
                  −{discount}%
                </span>
              )}
              <p className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
                <span className="text-xl font-bold leading-6 text-ink">{formatMoney(price)}</span>
                {offer.listPrice && (
                  <s data-part="card-list-price" className="text-sm text-muted">
                    {formatMoney(offer.listPrice)}
                  </s>
                )}
              </p>
            </>
          ) : (
            <p className="text-base font-medium leading-6 text-muted">Цена по запросу</p>
          )}
        </div>
        <h3
          data-part="card-title"
          className="mt-1 line-clamp-3 text-sm leading-5 text-ink [&_a]:hover:text-accent"
        >
          {title}
        </h3>
        {offer.sku && (
          <div className="mt-1 flex justify-end">
            <CopyCode value={offer.sku} copyLabel={`Скопировать артикул ${offer.sku}`} />
          </div>
        )}
        <div className="mt-auto pt-3">
          {price && offer.deposit && (
            <p data-part="card-caption" className="mb-2 text-[13px] leading-4 text-muted">
              Бронь {formatMoney(offer.deposit)} вперёд
            </p>
          )}
          {/* Наличие своей строкой над кнопкой: «В наличии: 1000 шт.» не упрётся в неё. */}
          <p
            data-part="card-stock"
            data-state={stockLine.state}
            className={`text-[13px] leading-4 ${
              stockLine.state === 'in-stock' ? 'text-success' : 'text-muted'
            }`}
          >
            {stockLine.text}
          </p>
          {price && !gone && (
            <div className="mt-2">
              <AddToCart
                offer={offer.id}
                snapshot={offer}
                title={offer.title}
                available={stock}
                cartHref={cartHref}
                className="min-h-9 px-4 py-1.5 text-sm"
                label={offer.howToBuy === 'request' ? 'Оставить заявку' : 'В корзину'}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
