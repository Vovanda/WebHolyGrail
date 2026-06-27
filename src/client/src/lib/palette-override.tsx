import type { ThemeConfig } from 'contracts';

import { findPreset, type PaletteColors } from './palette-presets';

/**
 * PaletteOverride — server-injected <style> с override базовых CSS-переменных
 * для каждой темы. Логика:
 *
 *   1. base = preset (SiteSettings.theme.palettePreset, default 'whg-default')
 *   2. overrides = SiteSettings.theme.paletteLight / paletteDark (per-color fields)
 *   3. финальная палитра = base merged с overrides (override > base)
 *
 * Если preset === 'custom' — base пустой, используются только overrides.
 * Если поле в overrides пустое — берётся значение из preset.
 *
 * Невалидные hex'и (не #RRGGBB) игнорируются.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

interface Palette {
  primary?: string | null;
  primaryHover?: string | null;
  foreground?: string | null;
  foregroundMuted?: string | null;
  background?: string | null;
  surface?: string | null;
  success?: string | null;
  danger?: string | null;
}

function pick(field: string | null | undefined): string | null {
  if (typeof field !== 'string') return null;
  return HEX.test(field) ? field : null;
}

function merge(base: PaletteColors | null, overrides: Palette): PaletteColors | null {
  const result: PaletteColors = {
    primary: pick(overrides.primary) ?? base?.primary ?? '',
    primaryHover: pick(overrides.primaryHover) ?? base?.primaryHover ?? '',
    foreground: pick(overrides.foreground) ?? base?.foreground ?? '',
    foregroundMuted: pick(overrides.foregroundMuted) ?? base?.foregroundMuted ?? '',
    background: pick(overrides.background) ?? base?.background ?? '',
    surface: pick(overrides.surface) ?? base?.surface ?? '',
    success: pick(overrides.success) ?? base?.success ?? '',
    danger: pick(overrides.danger) ?? base?.danger ?? '',
  };
  const hasAny = Object.values(result).some(Boolean);
  return hasAny ? result : null;
}

function buildVars(p: PaletteColors): string {
  const lines: string[] = [];
  if (p.primary) {
    lines.push(`--color-accent: ${p.primary};`);
    lines.push(`--color-selection-bg: ${p.primary};`);
  }
  if (p.primaryHover) lines.push(`--color-accent-hover: ${p.primaryHover};`);
  if (p.foreground) lines.push(`--color-ink: ${p.foreground};`);
  if (p.foregroundMuted) lines.push(`--color-muted: ${p.foregroundMuted};`);
  if (p.background) {
    lines.push(`--color-bg: ${p.background};`);
    lines.push(`--color-page-bg: ${p.background};`);
  }
  if (p.surface) lines.push(`--color-surface: ${p.surface};`);
  if (p.success) lines.push(`--color-success: ${p.success};`);
  if (p.danger) lines.push(`--color-danger: ${p.danger};`);
  return lines.join(' ');
}

export function PaletteOverride({ config }: { readonly config: ThemeConfig }) {
  const c = config as ThemeConfig & {
    palettePreset?: string;
    paletteLight?: Palette;
    paletteDark?: Palette;
  };

  const preset = c.palettePreset === 'custom' ? null : findPreset(c.palettePreset);
  const light = merge(preset?.light ?? null, c.paletteLight ?? {});
  const dark = merge(preset?.dark ?? null, c.paletteDark ?? {});

  const lightVars = light ? buildVars(light) : '';
  const darkVars = dark ? buildVars(dark) : '';

  if (!lightVars && !darkVars) return null;

  const css = `${lightVars ? `:root{${lightVars}}` : ''}${darkVars ? `:root[data-theme="dark"]{${darkVars}}` : ''}`;

  return <style id="hg-palette-override" dangerouslySetInnerHTML={{ __html: css }} />;
}
