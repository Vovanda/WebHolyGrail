import { ENGINE_PAGE_BLOCKS, ENGINE_REUSABLE_INNER_BLOCKS } from './engine';
import { withAppearance } from './_appearance';
import { DemoAccessBlock } from './domain/whg/DemoAccess';
import { SpecialistDirectoryBlock } from './domain/whg/SpecialistDirectory';
import { SpecialistProfileBlock } from './domain/whg/SpecialistProfile';

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
/*
  Доменные блоки нужны и внутри переиспользуемых секций, а не только на страницах:
  раньше они лежали в наборе движка и попадали в оба списка. Забыть один из них
  значит выкинуть блок оттуда, где его уже используют, - и вместе с ним таблицу.
*/
export const REUSABLE_INNER_BLOCKS = [
  ...ENGINE_REUSABLE_INNER_BLOCKS,
  withAppearance(DemoAccessBlock),
  withAppearance(SpecialistDirectoryBlock),
  withAppearance(SpecialistProfileBlock),
];

/*
  Проба доступа по коду - блок витрины, а не движка: он показывает, как работает
  доступ, и оживает только при заданном плейлисте для демонстрации. Сайту он
  не нужен, поэтому лежит в domain и синком не уезжает.
*/
export const PAGE_BLOCKS = [
  ...ENGINE_PAGE_BLOCKS,
  withAppearance(DemoAccessBlock),
  withAppearance(SpecialistDirectoryBlock),
  withAppearance(SpecialistProfileBlock),
];
