import { ENGINE_PAGE_BLOCKS, ENGINE_REUSABLE_INNER_BLOCKS } from './engine';
import { withAppearance } from './_appearance';
import { BlockShowcaseBlock } from './domain/whg/BlockShowcase';
import { DemoAccessBlock } from './domain/whg/DemoAccess';
import { ProjectTypesGridBlock } from './domain/whg/ProjectTypesGrid';
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
  withAppearance(BlockShowcaseBlock),
  withAppearance(DemoAccessBlock),
  withAppearance(ProjectTypesGridBlock),
  withAppearance(SpecialistDirectoryBlock),
  withAppearance(SpecialistProfileBlock),
];

/*
  Блоки витрины - проба доступа по коду, витрина блоков, сетка типов проектов -
  движку не принадлежат: они рассказывают о самом шаблоне. Лежат в domain
  и синком не уезжают, а подключены здесь, в точке сборки этого сайта.
*/
export const PAGE_BLOCKS = [
  ...ENGINE_PAGE_BLOCKS,
  withAppearance(BlockShowcaseBlock),
  withAppearance(DemoAccessBlock),
  withAppearance(ProjectTypesGridBlock),
  withAppearance(SpecialistDirectoryBlock),
  withAppearance(SpecialistProfileBlock),
];
