import type { CSSProperties } from 'react';
import type { SiteSettings } from 'contracts';

/**
 * Задан ли у сайта фон страницы.
 *
 * @remarks
 * По этому признаку раскладка переходит в стекло: лист становится
 * полупрозрачным, секции снимают заливку, и фото читается под содержимым.
 */
export function hasBackdrop(settings: SiteSettings): boolean {
  return Boolean(settings.pageBackground?.image || settings.pageBackground?.imageDark);
}

/**
 * Шаг секции из настроек - переменными для стилей.
 *
 * @remarks
 * Пустое поле переменную не ставит: тогда действует умолчание из стилей.
 */
export function blockSpaceVars(settings: SiteSettings): CSSProperties | undefined {
  const narrow = settings.blockSpace?.narrow?.trim();
  const wide = settings.blockSpace?.wide?.trim();
  if (!narrow && !wide) return undefined;
  return {
    ...(narrow ? { '--block-space-narrow': narrow } : {}),
    ...(wide ? { '--block-space-wide': wide } : {}),
  } as CSSProperties;
}
