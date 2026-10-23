import type { MediaRef, OfferView } from 'contracts';
import { formatMoney } from 'contracts';

import { MediaImage } from '@/blocks/primitives/Media';

import { AddToCart } from './AddToCart';

/**
 * Карточка позиции в плитке: витрина и раздел каталога рисуют её одинаково.
 *
 * @remarks
 * Рисуется на сервере (R14); живая только кнопка корзины. Есть адрес позиции -
 * картинка и название ведут на её страницу `/shop/item/<слаг>`.
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
  const picture = image ? (
    <MediaImage
      media={image}
      place="(max-width: 768px) 100vw, 360px"
      alt=""
      zoom={false}
      className={`h-full w-full object-cover${gone ? ' opacity-60 grayscale' : ''}`}
    />
  ) : null;
  const badge = gone ? 'Нет в наличии' : offer.howToBuy === 'request' ? 'По заявке' : null;
  return (
    <article
      data-part="card"
      data-state={gone ? 'sold-out' : 'available'}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface"
    >
      {image ? (
        <div data-part="card-media" className="aspect-[4/3] overflow-hidden border-b border-border">
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
          className="flex aspect-[4/3] items-end border-b border-border bg-accent-soft p-5"
        >
          <h3
            data-part="card-title"
            className="line-clamp-3 text-balance font-display text-2xl font-semibold leading-tight text-ink"
          >
            {href ? <a href={href}>{offer.title}</a> : offer.title}
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
            {href ? <a href={href}>{offer.title}</a> : offer.title}
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
                snapshot={offer}
                title={offer.title}
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
}
