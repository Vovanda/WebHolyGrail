/**
 * Карусель.
 *
 * @remarks
 * `CarouselDeck` - действующий примитив: режимы, стрелки, точки, автоповорот,
 * петля и переходы собраны в одном месте. Новое пишем на нём.
 *
 * `PhotoDeck` - карусель снимков поверх примитива: вписывание кадра, высота
 * по первому, размытые поля, открытие крупно.
 *
 * `CarouselRows` остаётся ради сайтов, собранных раньше: его разметка и пропсы
 * менялись бы вместе с ними, поэтому он живёт как есть.
 */
export { CarouselDeck, CarouselItem } from './CarouselDeck';
export type { CarouselDeckProps, CarouselMode } from './CarouselDeck';

export { PhotoDeck } from './PhotoDeck';

export { CarouselRows, CarouselRows as Carousel } from './CarouselRows';
export type { CarouselProps, CarouselSlide } from './types';
