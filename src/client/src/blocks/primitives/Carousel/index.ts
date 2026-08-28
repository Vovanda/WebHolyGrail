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
 * `CarouselRows` остаётся ради сайтов, собранных раньше, и помечен устаревшим:
 * его разметка и пропсы менялись бы вместе с ними, а удаление из шаблона унесло
 * бы файл из каждого сайта и остановило там сборку (R10).
 */
export { CarouselDeck, CarouselItem } from './CarouselDeck';
export type { CarouselDeckProps, CarouselMode } from './CarouselDeck';

export { PhotoDeck } from './PhotoDeck';

/**
 * @deprecated Устаревшая реализация - живёт ради сайтов, собранных раньше.
 * Новое листание собирается на `CarouselDeck` и `PhotoDeck`.
 */
export { CarouselRows, CarouselRows as Carousel } from './CarouselRows';
export type { CarouselProps, CarouselSlide } from './types';
