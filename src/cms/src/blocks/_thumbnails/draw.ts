/**
 * Детали схемы блока для окна выбора в админке.
 *
 * @remarks
 * Payload рисует картинку блока обычным `<img>`, поэтому цвета админки внутрь
 * не проникают. Схема нарисована полупрозрачным серо-синим на прозрачном поле:
 * такие тона читаются и на светлой, и на тёмной подложке карточки.
 *
 * Поле 240×160 - пропорция 3:2, которую окно выбора отводит под картинку.
 */

export const W = 240;
export const H = 160;

const INK = '#8b96a3';
const ACCENT = '#4a90d9';

type Tone = 'ink' | 'soft' | 'accent' | 'faint';

const FILL: Record<Tone, string> = {
  ink: `fill="${INK}" fill-opacity="0.75"`,
  soft: `fill="${INK}" fill-opacity="0.35"`,
  faint: `fill="${INK}" fill-opacity="0.16"`,
  accent: `fill="${ACCENT}" fill-opacity="0.85"`,
};

/** Строка текста: скруглённая полоса. */
export function bar(x: number, y: number, w: number, tone: Tone = 'soft', h = 6): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ${FILL[tone]}/>`;
}

/** Несколько строк текста абзацем, последняя короче. */
export function lines(
  x: number,
  y: number,
  w: number,
  count: number,
  gap = 10,
  tone: Tone = 'soft',
): string {
  return Array.from({ length: count }, (_, i) =>
    bar(x, y + i * gap, i === count - 1 && count > 1 ? w * 0.6 : w, tone),
  ).join('');
}

/** Плоскость: карточка, панель, поле. */
export function box(
  x: number,
  y: number,
  w: number,
  h: number,
  tone: Tone = 'faint',
  r = 4,
): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${FILL[tone]}/>`;
}

/** Рамка без заливки: поле ввода, граница карточки. */
export function frame(x: number, y: number, w: number, h: number, r = 4): string {
  return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="none" stroke="${INK}" stroke-opacity="0.55"/>`;
}

/** Картинка: плоскость с горами и солнцем. */
export function picture(x: number, y: number, w: number, h: number, r = 4): string {
  const base = y + h;
  const s = Math.min(w, h);
  return [
    box(x, y, w, h, 'faint', r),
    `<circle cx="${x + w * 0.72}" cy="${y + h * 0.32}" r="${s * 0.09}" ${FILL.soft}/>`,
    `<path d="M${x + w * 0.08} ${base - h * 0.12} L${x + w * 0.36} ${y + h * 0.45} L${x + w * 0.56} ${base - h * 0.3} L${x + w * 0.68} ${y + h * 0.58} L${x + w * 0.92} ${base - h * 0.12} Z" ${FILL.soft}/>`,
  ].join('');
}

/** Кнопка. */
export function button(x: number, y: number, w = 44, tone: Tone = 'accent', h = 12): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ${FILL[tone]}/>`;
}

/** Треугольник воспроизведения поверх видео. */
export function play(cx: number, cy: number, r = 12): string {
  return [
    `<circle cx="${cx}" cy="${cy}" r="${r}" ${FILL.ink}/>`,
    `<path d="M${cx - r * 0.3} ${cy - r * 0.45} L${cx + r * 0.5} ${cy} L${cx - r * 0.3} ${cy + r * 0.45} Z" fill="#fff" fill-opacity="0.9"/>`,
  ].join('');
}

/** Стрелка листания: влево или вправо. */
export function chevron(cx: number, cy: number, dir: 'left' | 'right', r = 8): string {
  const d = dir === 'left' ? 1 : -1;
  return [
    `<circle cx="${cx}" cy="${cy}" r="${r}" ${FILL.faint}/>`,
    `<path d="M${cx + d * r * 0.25} ${cy - r * 0.4} L${cx - d * r * 0.25} ${cy} L${cx + d * r * 0.25} ${cy + r * 0.4}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  ].join('');
}

/** Точки листания под слайдером; активная - акцентом. */
export function dots(cx: number, y: number, count: number, active = 0): string {
  const step = 9;
  const start = cx - ((count - 1) * step) / 2;
  return Array.from(
    { length: count },
    (_, i) =>
      `<circle cx="${start + i * step}" cy="${y}" r="2.5" ${FILL[i === active ? 'accent' : 'soft']}/>`,
  ).join('');
}

/** Значок-кружок: иконка фичи, аватар. */
export function dot(cx: number, cy: number, r = 6, tone: Tone = 'accent'): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${FILL[tone]}/>`;
}

/** Готовая схема как data-URI: без раздачи файлов и без зависимости от адреса админки. */
export function svg(parts: string[]): string {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join('')}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(body)}`;
}
