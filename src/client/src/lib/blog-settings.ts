import { BLOG_COLUMN_PX } from 'contracts';
import type { BlogColumnWidth, BlogGlobalSettings, SiteSettings } from 'contracts';

/**
 * Дефолты блога на случай, когда `SiteSettings.blog` ещё не заполнен в админке
 * (свежий инстанс) или CMS недоступна.
 */
export const DEFAULT_BLOG_SETTINGS: BlogGlobalSettings = {
  showAuthor: true,
  showDate: true,
  showReadingTime: true,
  showTags: true,
  postsPerPage: 10,
  defaultSort: 'newest',
  columnWidth: 'page',
};

/**
 * Достаёт группу `blog` из SiteSettings с фолбэком на дефолты.
 *
 * @remarks
 * Группа опциональна в глобале, а `SiteSettings` в contracts её пока не
 * описывает — отсюда локальное сужение типа вместо `any` по всему коду.
 */
export function resolveBlogSettings(settings: SiteSettings | null | undefined): BlogGlobalSettings {
  const blog = (settings as unknown as { blog?: Partial<BlogGlobalSettings> } | null)?.blog;
  if (!blog) return DEFAULT_BLOG_SETTINGS;
  return { ...DEFAULT_BLOG_SETTINGS, ...blog };
}

/** Колонка блога: класс ширины и её предел в точках. */
export interface BlogColumn {
  readonly className: string;
  /** Предел колонки в точках - для подсказки браузеру, какую ступень кадра брать. */
  readonly width: number;
}

/*
  Классы написаны целиком: стили собираются по тексту исходников, и склеенное
  из частей имя в них не попадёт.
*/
const COLUMNS: Record<BlogColumnWidth, BlogColumn> = {
  page: { className: 'max-w-wide', width: BLOG_COLUMN_PX.page },
  medium: { className: 'max-w-medium', width: BLOG_COLUMN_PX.medium },
  reading: { className: 'max-w-content', width: BLOG_COLUMN_PX.reading },
};

/**
 * Колонка страниц блога по выбору владельца.
 *
 * @remarks
 * Пусто и незнакомое значение - ширина страницы: у живого сайта без
 * настройки блог идёт той же вёрсткой, что остальные страницы.
 */
export function blogColumn(width: BlogColumnWidth | null | undefined): BlogColumn {
  return width && Object.hasOwn(COLUMNS, width) ? COLUMNS[width] : COLUMNS.page;
}
