import { ENGINE_PAGE_BLOCKS, ENGINE_REUSABLE_INNER_BLOCKS } from './engine';

/**
 * Точка сборки блоков. Принадлежит сайту.
 *
 * @remarks
 * Сперва всё из движка, ниже свои доменные блоки:
 *
 * ```ts
 * export const PAGE_BLOCKS = [...ENGINE_PAGE_BLOCKS, DogCardBlock];
 * ```
 *
 * Обновление этот файл не трогает, поэтому доменный блок живёт вечно, а новый
 * общий доезжает сам вместе с набором.
 */
export const REUSABLE_INNER_BLOCKS = [...ENGINE_REUSABLE_INNER_BLOCKS];

export const PAGE_BLOCKS = [...ENGINE_PAGE_BLOCKS];
