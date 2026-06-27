import type { Config } from 'tailwindcss';

/**
 * Tailwind config for client.
 *
 * @remarks
 * Цвет/отступ/радиус/шрифт — **только через CSS-переменные из tokens.css** (R2).
 * Здесь маппинг утилит на переменные, без хардкодов значений.
 * Если в JSX встретится `bg-[#hex]` или `text-[12px]` — это нарушение R2,
 * блок должен использовать `bg-surface` / `text-base` / etc.
 *
 * Dark mode — через `[data-theme="dark"]` атрибут на `<html>` (см. ThemeBootstrap
 * в `lib/theme-bootstrap.tsx`). Tailwind `dark:` варианты включаются автоматически.
 *
 * Источник правды токенов — `src/styles/tokens.css`.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'page-bg': 'var(--color-page-bg)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        paper: 'var(--color-paper)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',

        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-soft': 'var(--color-accent-soft)',

        success: 'var(--color-success)',
        'success-soft': 'var(--color-success-soft)',

        danger: 'var(--color-danger)',
        'danger-soft': 'var(--color-danger-soft)',

        'dark-block': 'var(--color-dark-block)',
        'dark-block-fg': 'var(--color-dark-block-fg)',

        vk: 'var(--color-vk)',
        'vk-hover': 'var(--color-vk-hover)',
        'vk-soft': 'var(--color-vk-soft)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        h1: ['var(--text-h1)', { lineHeight: 'var(--line-height-tight)' }],
        h2: ['var(--text-h2)', { lineHeight: 'var(--line-height-tight)' }],
        h3: ['var(--text-h3)', { lineHeight: '1.2' }],
        h4: ['var(--text-h4)', { lineHeight: '1.3' }],
      },
      maxWidth: {
        content: 'var(--container-content)',
        wide: 'var(--container-wide)',
        full: 'var(--container-full)',
      },
    },
  },
  plugins: [],
};

export default config;
