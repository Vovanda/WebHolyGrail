/**
 * Контраст по WCAG 2.1 — чтобы текст поверх цвета из админки оставался
 * читаемым (#64).
 *
 * @remarks
 * Палитру задаёт контент-менеджер, и «золотой» accent с белым текстом на
 * кнопке даёт ~1.7:1 — надпись пропадает. Цвет текста поэтому не зашит в
 * компонентах, а считается от фона.
 */

/** Текст поверх светлого фона. */
export const DARK_FG = '#0b1120';
/** Текст поверх тёмного фона. */
export const LIGHT_FG = '#f8fafc';

const HEX = /^#[0-9a-fA-F]{6}$/;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Относительная яркость цвета `#rrggbb`. */
export function luminance(hex: string): number {
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Отношение контраста двух цветов: от 1 (совпадают) до 21 (чёрный/белый). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Порог WCAG AA для обычного текста. */
const AA_NORMAL = 4.5;

/**
 * Цвет текста поверх `background` — тот из мягких, который читается лучше.
 * Если и он не дотягивает до AA (у части акцентов запас меньше 4.5), берём
 * чистый чёрный или белый: разница на глаз почти незаметна, а порог проходит.
 *
 * Невалидный hex → светлый текст (как было до токена).
 */
export function readableTextOn(background: string): string {
  if (!HEX.test(background)) return LIGHT_FG;

  const preferDark = contrastRatio(background, DARK_FG) >= contrastRatio(background, LIGHT_FG);
  const soft = preferDark ? DARK_FG : LIGHT_FG;
  if (contrastRatio(background, soft) >= AA_NORMAL) return soft;

  return preferDark ? '#000000' : '#ffffff';
}
