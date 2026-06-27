/**
 * Палитра-presets data для admin custom-компонентов. Дублирует
 * `src/client/src/lib/palette-presets.ts` (cms не должен импортировать из
 * client/ — R3 contracts boundary). Если в client изменился — обновить
 * вручную тут же.
 */

export interface PaletteColors {
  primary: string;
  primaryHover: string;
  foreground: string;
  foregroundMuted: string;
  background: string;
  surface: string;
  success: string;
  danger: string;
}

export interface PalettePreset {
  id: string;
  label: string;
  light: PaletteColors;
  dark: PaletteColors;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'whg-default',
    label: 'Web Holy Grail (default)',
    light: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      foreground: '#0a0a0a',
      foregroundMuted: '#737373',
      background: '#ffffff',
      surface: '#f5f5f5',
      success: '#16a34a',
      danger: '#dc2626',
    },
    dark: {
      primary: '#3b82f6',
      primaryHover: '#60a5fa',
      foreground: '#fafafa',
      foregroundMuted: '#a3a3a3',
      background: '#0f0f0f',
      surface: '#171717',
      success: '#22c55e',
      danger: '#ef4444',
    },
  },
  {
    id: 'linear',
    label: 'Linear',
    light: {
      primary: '#5e6ad2',
      primaryHover: '#4c56b8',
      foreground: '#1d1d1f',
      foregroundMuted: '#6c6c72',
      background: '#fcfcfd',
      surface: '#f4f5f8',
      success: '#3e9b4f',
      danger: '#eb4747',
    },
    dark: {
      primary: '#7b85e8',
      primaryHover: '#9aa1ee',
      foreground: '#f7f8f8',
      foregroundMuted: '#8a8f98',
      background: '#08090a',
      surface: '#1c1d22',
      success: '#4cb963',
      danger: '#f1666a',
    },
  },
  {
    id: 'vercel',
    label: 'Vercel',
    light: {
      primary: '#000000',
      primaryHover: '#333333',
      foreground: '#171717',
      foregroundMuted: '#666666',
      background: '#ffffff',
      surface: '#fafafa',
      success: '#0ea271',
      danger: '#e5484d',
    },
    dark: {
      primary: '#ffffff',
      primaryHover: '#cccccc',
      foreground: '#ededed',
      foregroundMuted: '#888888',
      background: '#000000',
      surface: '#0a0a0a',
      success: '#3dd68c',
      danger: '#ff6369',
    },
  },
  {
    id: 'github',
    label: 'GitHub',
    light: {
      primary: '#0969da',
      primaryHover: '#0860c4',
      foreground: '#1f2328',
      foregroundMuted: '#59636e',
      background: '#ffffff',
      surface: '#f6f8fa',
      success: '#1a7f37',
      danger: '#cf222e',
    },
    dark: {
      primary: '#2f81f7',
      primaryHover: '#4493f8',
      foreground: '#e6edf3',
      foregroundMuted: '#7d8590',
      background: '#0d1117',
      surface: '#161b22',
      success: '#3fb950',
      danger: '#f85149',
    },
  },
  {
    id: 'stripe',
    label: 'Stripe',
    light: {
      primary: '#635bff',
      primaryHover: '#4f47e5',
      foreground: '#0a2540',
      foregroundMuted: '#6b7c93',
      background: '#ffffff',
      surface: '#f6f9fc',
      success: '#3a8e3a',
      danger: '#df1b41',
    },
    dark: {
      primary: '#8a82ff',
      primaryHover: '#a39dff',
      foreground: '#f6f9fc',
      foregroundMuted: '#8c95a8',
      background: '#0a1929',
      surface: '#14223a',
      success: '#5dc66f',
      danger: '#ff5474',
    },
  },
];
