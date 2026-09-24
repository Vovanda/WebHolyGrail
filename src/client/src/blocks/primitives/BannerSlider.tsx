import type { CarouselSlide } from '@/blocks/arrangements/Carousel';
import { PhotoDeck } from '@/blocks/arrangements/Carousel';

interface BannerSliderProps {
  readonly banners: readonly CarouselSlide[];
}

/**
 * BannerSlider - верхний баннер сайта. Тонкая обёртка над каруселью снимков.
 *
 * @remarks
 * Параметры:
 *  - `period=7000` → автоповорот 7 сек
 *  - без стрелок-навигации
 *  - object-contain (не кропать) — баннер не должен кропаться
 *  - height auto — высота подстраивается под пропорции картинки
 *  - фон листа под прозрачными участками
 *
 * Баннер стоит во всю ширину страницы, и это же сказано ленте: по записи места
 * браузер выбирает вариант картинки, а знать про место может только тот, кто
 * ставит ленту.
 *
 * В ленту кадров баннер не попадает: шапка страницы и так во всю ширину,
 * а среди содержательных снимков она сбивает счёт.
 */
export function BannerSlider({ banners }: BannerSliderProps) {
  return (
    <PhotoDeck
      slides={banners}
      period={7000}
      arrows={false}
      swipe
      heightFromFirstSlide
      place="100vw"
      zoom={false}
      background="var(--color-bg)"
    />
  );
}
