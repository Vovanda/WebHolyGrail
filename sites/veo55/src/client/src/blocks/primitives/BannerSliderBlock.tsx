import type { BlockNode, SiteSettings } from '@veo55/contracts';
import { BannerSlider } from './BannerSlider';

/**
 * BannerSliderBlock — page-block wrapper для BannerSlider.
 * Читает поле `banners[].{imageUrl, alt}` из CMS и передаёт в UI-компонент.
 */
export interface BannerSliderData {
  readonly banners?: readonly {
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
    .filter((b) => b.imageUrl)
    .map((b) => ({ url: b.imageUrl!, alt: b.alt ?? '' }));

  if (items.length === 0) return null;

  return <BannerSlider banners={items} />;
}
