import type { MediaRef, OfferView } from 'contracts';
import { discountPercent, formatMoney } from 'contracts';

import { MediaImage } from '@/blocks/primitives/Media';
import { MediaPlaceholder } from '@/blocks/primitives/Media/MediaPlaceholder';

import { AddToCart } from './AddToCart';

/**
 * Позиция в ленте: фото, цена и название - почти квадратная плитка.
 *
 * @remarks
 * Лента показывает, что есть в разделе, а выбирают в выдаче, где стоит полная
 * `OfferCard`. Поэтому здесь только то, за что цепляется глаз: фото 4:3, цена
 * со скидкой одной строкой, название в две строки. Артикула и строки наличия
 * нет; позиции не в наличии фото серое с пометкой. «В корзину» появляется
 * поверх низа фото при наведении и фокусе и места в карточке не занимает.
 *
 * Части: `tile`, `tile-media`, `tile-price`, `tile-title`, `tile-action`.
 */
export function OfferTile({
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
  const media = image ? (
    <MediaImage
      media={image}
      place="(max-width: 767px) 45vw, 220px"
      alt=""
      zoom={false}
      className={`h-full w-full object-cover${gone ? ' opacity-60 grayscale' : ''}`}
    />
  ) : (
    <MediaPlaceholder size={32} />
  );
  return (
    <article
      data-part="tile"
      data-state={gone ? 'sold-out' : 'available'}
      className="group/tile flex h-full flex-col rounded-xl p-2 transition-colors hover:bg-surface"
    >
      <div
        data-part="tile-media"
        className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface"
      >
        {href ? (
          <a href={href} aria-hidden="true" tabIndex={-1} className="block h-full">
            {media}
          </a>
        ) : (
          media
        )}
        {gone && (
          <span className="absolute bottom-2 left-2 rounded-md bg-bg/90 px-1.5 py-0.5 text-xs text-muted">
            Нет в наличии
          </span>
        )}
        {price && !gone && (
          <div
            data-part="tile-action"
            className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-bg/90 p-1 opacity-0 transition-opacity group-focus-within/tile:opacity-100 group-hover/tile:opacity-100"
          >
            <AddToCart
              offer={offer.id}
              snapshot={offer}
              title={offer.title}
              available={stock}
              cartHref={cartHref}
              className="min-h-8 w-full px-3 py-1 text-sm"
              label={offer.howToBuy === 'request' ? 'Оставить заявку' : 'В корзину'}
            />
          </div>
        )}
      </div>
      <p
        data-part="tile-price"
        className="mt-2 flex flex-wrap items-baseline gap-x-1.5 tabular-nums"
      >
        {price ? (
          <>
            {discount !== null && (
              <span className="self-center rounded bg-success px-1 py-px text-xs font-medium leading-4 text-accent-fg">
                −{discount}%
              </span>
            )}
            <span className="text-base font-semibold leading-5 text-ink">{formatMoney(price)}</span>
            {offer.listPrice && (
              <s className="text-xs text-muted">{formatMoney(offer.listPrice)}</s>
            )}
          </>
        ) : (
          <span className="text-sm leading-5 text-muted">Цена по запросу</span>
        )}
      </p>
      {/* Две строки всегда: соседние плитки ленты одной высоты. */}
      <h3
        data-part="tile-title"
        className="mt-0.5 line-clamp-2 min-h-9 text-[13px] leading-[18px] text-ink [&_a]:hover:text-accent"
      >
        {href ? <a href={href}>{offer.title}</a> : offer.title}
      </h3>
    </article>
  );
}
