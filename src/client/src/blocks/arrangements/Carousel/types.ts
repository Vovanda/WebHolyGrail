import type { MediaRef } from 'contracts';

export interface CarouselSlide {
  /**
   * Документ медиатеки.
   *
   * @remarks
   * По нему показ берёт вариант под размер места и заготовку кадра. Из адреса
   * этого не узнать, поэтому документ главнее: адрес остаётся для картинок,
   * которые лежат не в медиатеке, - внешняя ссылка из старого поля блока.
   */
  readonly media?: MediaRef | null;
  /** Адрес картинки. Нужен там, где документа нет. */
  readonly url?: string;
  readonly alt: string;
}

export interface CarouselProps {
  readonly slides: readonly CarouselSlide[];
  readonly period?: number;
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
  /**
   * Сколько места лента занимает на экране.
   *
   * @remarks
   * По этой записи браузер выбирает вариант картинки, а знает про место тот,
   * кто ставит ленту: у баннера во всю ширину и у карусели в колонке разные
   * ответы. По умолчанию - ширина окна: лента снимков чаще стоит во всю ширину.
   */
  readonly place?: string;
  /**
   * Попадает ли снимок в ленту страницы, которая открывается на весь экран.
   *
   * @remarks
   * По умолчанию да: снимок для этого и показывают. Ленте баннеров ставится
   * `false` - шапка страницы и так во всю ширину, а в ленте она идёт вперемешку
   * с содержательными кадрами и сбивает счёт.
   *
   * Со своим открытием (`lightboxGroupId`) это не спорит: там показ ведёт сама
   * лента, и кубику открытие отключается всё равно.
   */
  readonly zoom?: boolean;
}
