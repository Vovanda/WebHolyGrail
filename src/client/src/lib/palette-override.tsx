import type { ThemeConfig } from 'contracts';

import { readableTextOn } from './contrast';
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
    // Текст на кнопках считаем от самого акцента: на золотой палитре белая
    // надпись не читается, на синей — не читается тёмная (#64).
    lines.push(`--color-accent-fg: ${readableTextOn(p.primary)};`);
    // Подложка иконок и бейджей — тот же акцент, разбавленный фоном. Без этого
    // она остаётся синей из дефолтных токенов и спорит с палитрой сайта.
    lines.push(`--color-accent-soft: color-mix(in srgb, ${p.primary} 22%, var(--color-bg));`);
  }
  if (p.primary) {
    // Текст на выделении считаем от акцента по той же причине, что и на кнопке.
    lines.push(`--color-selection-fg: ${readableTextOn(p.primary)};`);
  }
  if (p.primaryHover) lines.push(`--color-accent-hover: ${p.primaryHover};`);
  if (p.foreground) lines.push(`--color-ink: ${p.foreground};`);
  if (p.foregroundMuted) lines.push(`--color-muted: ${p.foregroundMuted};`);
  if (p.background) {
    lines.push(`--color-bg: ${p.background};`);
    lines.push(`--color-page-bg: ${p.background};`);
  }
  if (p.surface) lines.push(`--color-surface: ${p.surface};`);
  if (p.success) {
    lines.push(`--color-success: ${p.success};`);
    lines.push(`--color-success-soft: color-mix(in srgb, ${p.success} 18%, var(--color-bg));`);
  }
  if (p.danger) {
    lines.push(`--color-danger: ${p.danger};`);
    lines.push(`--color-danger-soft: color-mix(in srgb, ${p.danger} 18%, var(--color-bg));`);
  }
  // Граница — не самостоятельный цвет палитры, а текст, разбавленный фоном:
  // отдельным полем её пришлось бы подбирать вручную под каждую тему, и она
  // осталась бы серой на любом бренде, как это и было.
  if (p.foreground && p.background) {
    lines.push(
      `--color-border: color-mix(in srgb, ${p.foreground} 14%, ${p.background});`,
      // Плашка поверх surface: на светлой теме светлее фона, на тёмной — темнее.
      `--color-paper: color-mix(in srgb, ${p.foreground} 4%, ${p.background});`,
    );
  }
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

  // Тёмный блок (обложка, врезка с цитатой, сниппет кода) остаётся тёмным в
  // обеих темах — в этом его смысл. Но цвет берём из тёмной половины палитры,
  // иначе он остаётся синим из дефолтных токенов и на чёрно-золотом сайте
  // выглядит чужим пятном.
  const blockVars =
    dark?.background && dark?.foreground
      ? `--color-dark-block: ${dark.background}; --color-dark-block-fg: ${dark.foreground};`
      : '';

  if (!lightVars && !darkVars && !blockVars) return null;

  const rootVars = `${lightVars}${blockVars ? ` ${blockVars}` : ''}`;
  const css = `${rootVars ? `:root{${rootVars}}` : ''}${darkVars ? `:root[data-theme="dark"]{${darkVars}}` : ''}`;

  return <style id="hg-palette-override" dangerouslySetInnerHTML={{ __html: css }} />;
}
