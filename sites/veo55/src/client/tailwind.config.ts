import type { Config } from 'tailwindcss';

/**
 * Tailwind config for veo55 client.
 *
 * @remarks
 * Цвет/отступ/радиус — **только через CSS-переменные из tokens.css** (R2).
 * Здесь маппинг утилит на переменные, без хардкодов значений.
 * Если в JSX встретится `bg-[#hex]` или `text-[12px]` — это нарушение R2,
 * блок должен использовать `bg-surface` / `text-base` / etc.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        primary: 'var(--color-primary)',
        'primary-fg': 'var(--color-primary-fg)',
        accent: 'var(--color-accent)',
        border: 'var(--color-border)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
      },
      maxWidth: {
        content: 'var(--container-content)',
        wide: 'var(--container-wide)',
      },
    },
  },
  plugins: [],
};

export default config;
