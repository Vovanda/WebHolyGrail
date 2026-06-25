/**
 * Theme configuration — приходит из `SiteSettings.theme` (Payload global).
 *
 * @remarks
 * Тема = override CSS-переменных через `data-theme="<name>"` атрибут на `<html>`.
 * Никаких хардкод-цветов в компонентах (R12). Меняется только атрибут — компоненты
 * не переписываются.
 *
 * SSR: theme резолвится **до** first paint через `ThemeBootstrap` inline-скрипт,
 * чтобы избежать FOUC (вспышки светлой темы перед тёмной).
 */
export interface ThemeConfig {
  /**
   * Стартовый режим темы.
   * - `light` — всегда светлая (для визиток, контентных сайтов).
   * - `dark` — всегда тёмная.
   * - `auto` — respect `prefers-color-scheme` системы юзера.
   */
  readonly mode: 'light' | 'dark' | 'auto';

  /**
   * Показывать ли юзеру кнопку переключения темы (хедер/настройки).
   * Если `true` — юзер может переопределить `mode`, выбор сохраняется в localStorage.
   * Если `false` — `mode` строго применяется, переключателя нет.
   */
  readonly userToggle: boolean;

  /**
   * Список тем доступных для переключения, если `userToggle: true`.
   * По умолчанию — `['light', 'dark']`. Можно расширить кастомными темами
   * (`'contrast'`, `'sepia'`, etc) когда они появятся в `tokens.css`.
   */
  readonly availableThemes?: readonly string[];
}

/**
 * Имя темы — то что попадает в `data-theme` атрибут.
 * `'light'` — дефолт, не требует атрибута (значения живут в `:root`).
 * `'auto'` — псевдо-режим, резолвится в `light`/`dark` runtime через prefers-color-scheme.
 */
export type ThemeName = 'light' | 'dark' | 'auto' | (string & {});

/**
 * TODO (holygrail-themepalette): расширение для Шага 6+.
 *
 * Сейчас палитра задана статически в `tokens.css`. В будущем — переменные
 * редактируются прямо в Payload-админке (color-picker'ы) и SSR-инжектятся:
 *
 * ```ts
 * interface ThemeConfig {
 *   mode: 'light' | 'dark' | 'auto';
 *   userToggle: boolean;
 *   availableThemes?: readonly string[];
 *   palette?: {                          // ← НОВОЕ
 *     light?: Partial<Record<TokenName, string>>;  // overrides для light
 *     dark?: Partial<Record<TokenName, string>>;   // overrides для dark
 *   };
 * }
 * ```
 *
 * Алгоритм рендера: на сервере читаем `settings.theme.palette`, генерируем
 * `<style id="hg-tokens">:root{--color-accent: <hex>;}:root[data-theme='dark']{...}</style>`
 * и вставляем в `<head>` ПЕРЕД импортом tokens.css. Каскад CSS делает остальное.
 *
 * Это позволит админу менять брендинг (палитру) сайта без участия разработчика.
 * Особенно ценно при размножении сайтов из `_template` — у каждого свой бренд,
 * один template-код.
 *
 * См. roadmap-tokens-editor (создать когда дойдём).
 */
