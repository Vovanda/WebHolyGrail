/**
 * Карусель.
 *
 * @remarks
 * `CarouselDeck` - действующий примитив: режимы, стрелки, точки, автоповорот,
 * петля и переходы собраны в одном месте. Новое пишем на нём.
 *
 * `CarouselRows` остаётся ради сайтов, собранных раньше: его разметка и пропсы
 * менялись бы вместе с ними, поэтому он живёт как есть.
 */
export { CarouselDeck, CarouselItem } from './CarouselDeck';
export type { CarouselDeckProps, CarouselMode } from './CarouselDeck';

export { CarouselRows, CarouselRows as Carousel } from './CarouselRows';
export type { CarouselProps, CarouselSlide } from './types';
