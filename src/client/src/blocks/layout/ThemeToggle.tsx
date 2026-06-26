'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { setTheme } from '@/lib/theme-bootstrap';

/**
 * ThemeToggle — переключатель light ↔ dark.
 *
 * @remarks
 * Бутстрап темы (no-FOUC inline-script) уже отработал в `<head>` и проставил
 * `data-theme` на `<html>`. Здесь только UI-обёртка которая читает текущее
 * состояние при hydration и переключает через `setTheme()` helper.
 *
 * Перед hydration рендерим невидимую заглушку (одинаковая высота-ширина),
 * чтобы layout не прыгнул когда React смонтируется.
 *
 * Активность тоггла контролируется в SiteSettings.theme.userToggle — если
 * false, эту кнопку в Header не показываем. Здесь сам компонент всегда работает.
 */
export function ThemeToggle({ className }: { readonly className?: string }) {
  const [theme, setLocalTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light';
    setLocalTheme(current);
  }, []);

  if (theme === null) {
    // Skeleton до hydration — той же геометрии что и реальная кнопка.
    return (
      <span aria-hidden="true" className={`inline-block h-9 w-9 rounded-md ${className ?? ''}`} />
    );
  }

  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Включить тёмную тему' : 'Включить светлую тему';

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        setLocalTheme(next);
      }}
      aria-label={label}
      title={label}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-muted ' +
        'hover:text-ink hover:bg-surface-hover transition-colors ' +
        (className ?? '')
      }
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
