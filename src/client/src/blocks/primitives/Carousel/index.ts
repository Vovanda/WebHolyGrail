/**
 * Карусель.
 *
 * @remarks
 * `CarouselDeck` - действующий примитив: режимы, стрелки, точки, автоповорот,
 * петля и переходы собраны в одном месте. Новое пишем на нём.
 *
 * `PhotoDeck` - карусель снимков поверх примитива: вписывание кадра, высота
 * по первому, размытые поля, открытие крупно.
 */
export { CarouselDeck, CarouselItem } from './CarouselDeck';
export type { CarouselDeckProps, CarouselMode } from './CarouselDeck';

export { PhotoDeck } from './PhotoDeck';
export type { CarouselProps, CarouselSlide } from './types';
