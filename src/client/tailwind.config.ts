import type { Config } from 'tailwindcss';

/**
 * Tailwind config for veo55 client.
 *
 * @remarks
 * Цвет/отступ/радиус/шрифт — **только через CSS-переменные из tokens.css** (R2).
 * Здесь маппинг утилит на переменные, без хардкодов значений.
 * Если в JSX встретится `bg-[#hex]` или `text-[12px]` — это нарушение R2,
 * блок должен использовать `bg-surface` / `text-base` / etc.
 *
 * Источник правды токенов — `src/styles/tokens.css`, выведено из живого
 * `veo55/src/assets/veo-ui.css`. См. `holy-grail/reference/veo55-visual-pasport`.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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

        vk: 'var(--color-vk)',
        'vk-hover': 'var(--color-vk-hover)',

        danger: 'var(--color-danger)',

        'puppy-reserved': 'var(--color-puppy-reserved)',
        'puppy-available': 'var(--color-puppy-available)',
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
        script: 'var(--font-script)',
      },
      fontSize: {
        h1: ['var(--text-h1)', { lineHeight: '1.1' }],
        h2: ['var(--text-h2)', { lineHeight: '1.15' }],
        h3: ['var(--text-h3)', { lineHeight: '1.2' }],
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
