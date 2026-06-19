import { Carousel } from './Carousel';

interface BannerItem {
  url: string;
  alt: string;
}

interface BannerSliderProps {
  readonly banners: readonly BannerItem[];
}

/**
 * BannerSlider — top-баннер сайта. Тонкий wrapper над общим `Carousel`.
 *
 * @remarks
 * Параметры из оригинала veo55 (`.veo-banner` в main.html):
 *  - `data-auto="7000"` → автоповорот 7 сек
 *  - без стрелок-навигации
 *  - object-contain (не кропать) — Володя явно сказал «банер не должен кропатся»
 *  - height auto — высота подстраивается под пропорции картинки (max-height 520 в оригинале)
 *  - фон `#1d1612` под прозрачными участками
 */
export function BannerSlider({ banners }: BannerSliderProps) {
  return (
    <Carousel
      slides={banners}
      interval={7000}
      arrows={false}
      swipe
      heightFromFirstSlide
      background="#ffffff"
    />
  );
}
