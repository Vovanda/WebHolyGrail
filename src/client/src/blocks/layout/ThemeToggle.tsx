'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

import { setTheme } from '@/lib/theme-bootstrap';

/**
 * ThemeToggle — циклический переключатель light → dark → auto → light.
 *
 * @remarks
 * При mount читает state из localStorage('hg-theme'):
 *  - 'light' / 'dark' — explicit override от юзера
 *  - отсутствует / 'auto' — auto mode (следует prefers-color-scheme)
 *
 * Click cycle: light → dark → auto → light → ...
 * Иконка отражает текущее значение: Sun / Moon / Monitor.
 */

const STORAGE_KEY = 'hg-theme';
type Mode = 'light' | 'dark' | 'auto';

function readCurrentMode(): Mode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // private mode / CSP
  }
  return 'auto';
}

function nextMode(current: Mode): Mode {
  if (current === 'light') return 'dark';
  if (current === 'dark') return 'auto';
  return 'light';
}

const LABELS: Record<Mode, string> = {
  light: 'Светлая тема',
  dark: 'Тёмная тема',
  auto: 'Авто (по системе)',
};

export function ThemeToggle({ className }: { readonly className?: string }) {
  // Default 'auto' при SSR — кнопка видима сразу без skeleton-задержки.
  // После hydration useEffect перечитывает реальное состояние из localStorage,
  // если оно отличается — icon сменится (один кадр flash, не критично).
  const [mode, setMode] = useState<Mode>('auto');

  useEffect(() => {
    setMode(readCurrentMode());
  }, []);

  const next = nextMode(mode);
  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        setMode(next);
      }}
      aria-label={`Текущая: ${LABELS[mode]}. Click → ${LABELS[next]}`}
      title={`${LABELS[mode]} → ${LABELS[next]}`}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-muted ' +
        'hover:text-ink hover:bg-surface-hover transition-colors ' +
        (className ?? '')
      }
    >
      <Icon size={18} />
    </button>
  );
}
