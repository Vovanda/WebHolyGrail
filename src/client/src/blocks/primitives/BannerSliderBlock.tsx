import type { BlockNode, MediaRef, SiteSettings } from 'contracts';
import { BannerSlider } from './BannerSlider';

/**
 * Баннер страницы: поле блока превращается в слайды ленты.
 *
 * @remarks
 * Картинка берётся из медиатеки, а внешний адрес остаётся рядом и работает
 * как прежде: страницы, собранные на нём до появления медиатеки в этом блоке,
 * не должны погаснуть.
 */
export interface BannerSliderData {
  readonly banners?: readonly {
    image?: MediaRef | null;
    /** @deprecated Заменено полем `image`. Остаётся у страниц, собранных раньше. */
    imageUrl?: string | null;
    alt?: string | null;
  }[];
}

export function BannerSliderBlock({
  node,
}: {
  readonly node: BlockNode & { data?: BannerSliderData };
  readonly settings: SiteSettings;
}) {
  const items = (node.data?.banners ?? [])
    .filter((banner) => banner.image ?? banner.imageUrl)
    .map((banner) => ({
      ...(banner.image ? { media: banner.image } : {}),
      ...(banner.imageUrl ? { url: banner.imageUrl } : {}),
      alt: banner.alt ?? '',
    }));

  if (items.length === 0) return null;

  return <BannerSlider banners={items} />;
}
