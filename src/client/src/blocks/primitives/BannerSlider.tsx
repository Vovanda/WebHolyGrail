import { PhotoDeck } from './Carousel';

interface BannerItem {
  url: string;
  alt: string;
}

interface BannerSliderProps {
  readonly banners: readonly BannerItem[];
}

/**
 * BannerSlider - верхний баннер сайта. Тонкая обёртка над каруселью снимков.
 *
 * @remarks
 * Параметры:
 *  - `interval=7000` → автоповорот 7 сек
 *  - без стрелок-навигации
 *  - object-contain (не кропать) — баннер не должен кропаться
 *  - height auto — высота подстраивается под пропорции картинки
 *  - фон листа под прозрачными участками
 */
export function BannerSlider({ banners }: BannerSliderProps) {
  return (
    <PhotoDeck
      slides={banners}
      interval={7000}
      arrows={false}
      swipe
      heightFromFirstSlide
      background="var(--color-bg)"
    />
  );
}
