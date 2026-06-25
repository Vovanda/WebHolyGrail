export interface CarouselSlide {
  readonly url: string;
  readonly alt: string;
}

export interface CarouselProps {
  readonly slides: readonly CarouselSlide[];
  readonly interval?: number;
  readonly arrows?: boolean;
  readonly swipe?: boolean;
  readonly objectFit?: 'cover' | 'contain';
  readonly aspect?: string;
  readonly height?: string;
  readonly heightFromFirstSlide?: boolean;
  readonly background?: string;
  readonly rounded?: string;
  /**
   * Если true и objectFit='contain' — рендерит blurred copy слайда как backdrop,
   * заполняющий поля по бокам/сверху-снизу. Letterbox-стиль для смешанной
   * ориентации фото (горизонталь+вертикаль в одной карусели).
   */
  readonly backdropBlur?: boolean;
  /**
   * Если указан — клик/тап по слайду открывает PhotoLightbox с этой группой.
   * Должно быть уникальным per-карусель.
   */
  readonly lightboxGroupId?: string;
}
