import { BLOG_COLUMN_PX, BLOG_TEXT_PX, type BlogColumnWidth } from 'contracts';

/**
 * Лист редактора статьи: ширина колонки сайта и строки текста в ней.
 *
 * @remarks
 * Здесь только счёт, без браузера и Payload. Лист повторяет колонку блога
 * в настоящих точках: сжатый пропорционально, он переносил бы строки не там,
 * где сайт, - шрифт вместе с ним не сжимается.
 */

/** Где стоит лист в поле: по центру, как на сайте, или у левого края. */
export type SheetAlign = 'center' | 'left';

export interface SheetSize {
  /** Ширина листа - колонка блога. */
  readonly sheet: number;
  /** Строка текста и одиночных кадров внутри листа. */
  readonly text: number;
}

/** Размер листа по настройке ширины блога; пусто и незнакомое - как у страницы. */
export function sheetSize(width: unknown): SheetSize {
  const known = typeof width === 'string' && Object.hasOwn(BLOG_COLUMN_PX, width);
  const sheet = BLOG_COLUMN_PX[known ? (width as BlogColumnWidth) : 'page'];
  return { sheet, text: Math.min(BLOG_TEXT_PX, sheet) };
}

/** Сохранённый выбор; пусто и мусор - по центру. */
export function readAlign(stored: string | null | undefined): SheetAlign {
  return stored === 'left' ? 'left' : 'center';
}

export function otherAlign(align: SheetAlign): SheetAlign {
  return align === 'center' ? 'left' : 'center';
}
