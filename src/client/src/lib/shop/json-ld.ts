import { moneyDecimal, type OfferView } from 'contracts';

import { canonical } from '@/lib/seo';

/**
 * Разметка позиции магазина для поисковика - `Product` с предложением.
 *
 * @remarks
 * Поля берутся из данных позиции, руками ничего не дублируется (R0): название,
 * описание, артикул, картинки и цена. Наличие считается по остатку: штучная
 * позиция с нулём - `OutOfStock`. Пустая цена (позиция по запросу) - разметка
 * без предложения, иначе поисковик покажет «0».
 */
export function offerJsonLd(
  offer: OfferView,
  options: { readonly path: string; readonly images?: readonly string[] },
): Record<string, unknown> {
  const sold = offer.stock !== null && offer.stock <= 0;
  const url = canonical(options.path);
  const images = (options.images ?? []).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: offer.title,
    url,
    ...(offer.summary ? { description: offer.summary } : {}),
    ...(offer.sku ? { sku: offer.sku } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(offer.price
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: moneyDecimal(offer.price),
            priceCurrency: offer.price.currency,
            availability: sold ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

/** Разметка выдачи каталога - `ItemList` из позиций текущей страницы. */
export function offerListJsonLd(options: {
  readonly name: string;
  readonly items: ReadonlyArray<{ readonly title: string; readonly slug: string | null }>;
}): Record<string, unknown> {
  const items = options.items.filter((item) => item.slug !== null);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: canonical(`/shop/item/${item.slug}`),
    })),
  };
}
