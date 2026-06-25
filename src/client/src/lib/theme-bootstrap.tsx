import type { ThemeConfig } from '@veo55/contracts';

const STORAGE_KEY = 'hg-theme';

/**
 * Inline-script который **синхронно** (до first paint) проставляет
 * `data-theme` на `<html>` чтобы избежать FOUC.
 *
 * @remarks
 * Алгоритм:
 *   1. Если в localStorage лежит user-override (и `userToggle: true`) — берём его.
 *   2. Иначе если `mode === 'auto'` — резолвим через `matchMedia('(prefers-color-scheme: dark)')`.
 *   3. Иначе используем `mode` как есть.
 *
 * Скрипт максимально короткий — он блокирует рендер, экономим байты.
 * Никаких сторонних импортов — только `window`, `document`, `localStorage`, `matchMedia`.
 */
export function ThemeBootstrap({ config }: { config: ThemeConfig }) {
  const { mode, userToggle, availableThemes = ['light', 'dark'] } = config;
  // JSON.stringify нужен чтобы корректно прокинуть значения в inline-скрипт.
  const payload = JSON.stringify({ mode, userToggle, availableThemes });

  // Скрипт читает payload, проставляет data-theme на <html> синхронно.
  // Если юзер раньше выбрал тему через переключатель — берём её, иначе — серверный mode.
  const script = `(function(){try{
    var cfg=${payload};
    var saved=cfg.userToggle?localStorage.getItem('${STORAGE_KEY}'):null;
    var resolved;
    if(saved&&cfg.availableThemes.indexOf(saved)>-1){resolved=saved}
    else if(cfg.mode==='auto'){
      resolved=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'
    }else{resolved=cfg.mode}
    if(resolved!=='light'){document.documentElement.setAttribute('data-theme',resolved)}
  }catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/**
 * Клиентский helper для переключения темы юзером (когда `userToggle: true`).
 * Сохраняет выбор в localStorage и проставляет атрибут на `<html>`.
 */
export function setTheme(theme: string): void {
  if (typeof window === 'undefined') return;
  if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage может быть недоступен (private mode / CSP) — молча игнорируем.
  }
}

/**
 * Дефолтный конфиг темы для случая когда `SiteSettings.theme` ещё не заполнен.
 * Используется на первом запуске CMS, пока юзер не задал предпочтения.
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  userToggle: false,
  availableThemes: ['light', 'dark'],
};
