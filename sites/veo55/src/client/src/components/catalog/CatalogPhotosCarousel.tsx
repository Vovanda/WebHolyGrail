import type { RkfPhoto } from '@veo55/contracts';

import { Carousel } from '@/blocks/primitives/Carousel';

/**
 * CatalogPhotosCarousel — тонкая обёртка над общим `Carousel` для фото-секции
 * РКФ-карточки.
 *
 * @remarks
 * **R9.** Не отдельный «catalog-carousel» — общая карусель проекта (та же что
 * на главной / в `/dog/<slug>`), просто с другими настройками: object-contain,
 * height 300→520, autoplay 6c, arrows если фото больше одного.
 *
 * **Server Component (R14).** `Carousel` сам клиентский — нам тут только
 * адаптер пропсов.
 */
export interface CatalogPhotosCarouselProps {
  readonly photos: ReadonlyArray<RkfPhoto>;
  readonly alt: string;
}

export function CatalogPhotosCarousel({ photos, alt }: CatalogPhotosCarouselProps) {
  if (photos.length === 0) return null;
  return (
    <div className="max-w-[720px] mx-auto mb-6">
      <Carousel
        slides={photos.map((p) => ({ url: p.url, alt }))}
        interval={6000}
        arrows={photos.length > 1}
        swipe
        objectFit="contain"
        height="clamp(300px, 60vw, 520px)"
        background="#F3EFE7"
        rounded="10px"
      />
    </div>
  );
}
