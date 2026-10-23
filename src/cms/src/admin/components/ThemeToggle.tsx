'use client';

import { useTheme } from '@payloadcms/ui';

/**
 * Смена темы админки одной кнопкой в меню, как на сайте: светлая → тёмная →
 * по системе.
 *
 * @remarks
 * Payload держит выбор темы только на странице учётной записи, и владелец
 * не находил его. Тема ставится штатным `useTheme`: он сам пишет куку и
 * атрибут страницы. `setTheme` принимает и `'auto'`, хотя тип объявляет
 * только светлую и тёмную - так его вызывает страница учётной записи.
 */

type Mode = 'light' | 'dark' | 'auto';

const LABELS: Record<Mode, string> = {
  light: 'Светлая тема',
  dark: 'Тёмная тема',
  auto: 'Авто (по системе)',
};

const NEXT: Record<Mode, Mode> = { light: 'dark', dark: 'auto', auto: 'light' };

const ICONS: Record<Mode, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  auto: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
};

export function ThemeToggle() {
  const { autoMode, setTheme, theme } = useTheme();
  const mode: Mode = autoMode ? 'auto' : theme;
  const next = NEXT[mode];

  return (
    <button
      type="button"
      onClick={() => setTheme(next as 'light' | 'dark')}
      aria-label={`${LABELS[mode]}. Нажать - ${LABELS[next]}`}
      title={`${LABELS[mode]} → ${LABELS[next]}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2rem',
        height: '2rem',
        padding: 0,
        border: 0,
        borderRadius: '50%',
        background: 'transparent',
        color: 'var(--theme-elevation-800)',
        cursor: 'pointer',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[mode]}
      </svg>
    </button>
  );
}
