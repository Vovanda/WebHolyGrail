import type { BlogGlobalSettings, SiteSettings } from 'contracts';

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
