import { luminance } from './contrast';

/**
 * Значок бренда для тёмной темы.
 *
 * @remarks
 * Значки брендов приходят адресом simpleicons с цветом в адресе:
 * `cdn.simpleicons.org/nextdotjs/000000`. Чёрный знак на тёмной теме
 * пропадает, а цвет выбирал владелец, не вёрстка. Для тёмного цвета здесь
 * строится тот же значок светлым; цветные знаки остаются как есть - на тёмном
 * фоне они читаются.
 */
const SIMPLE_ICON =
  /^(https?:\/\/cdn\.simpleicons\.org\/[^/?#]+)\/([0-9a-f]{6})(?:\/[0-9a-f]{6})?([?#].*)?$/i;

/** Светлее этого цвет на тёмной теме читается. Доля по относительной яркости. */
const DARK_BELOW = 0.12;

/**
 * Цвет знака на тёмной теме.
 *
 * @remarks
 * Это не цвет вёрстки, а параметр адреса simpleicons: сервис красит значок
 * сам и токенов сайта не читает. Светлый, но на тон глуше текста: знак
 * читается и не спорит с заголовками рядом.
 */
const ON_DARK = 'e5e5e5';

/** Адрес значка для тёмной темы; `null` - значок и так читается или адрес не simpleicons. */
export function darkThemeIconUrl(url: string): string | null {
  const found = SIMPLE_ICON.exec(url);
  if (!found) return null;
  const [, base, color, tail = ''] = found;
  if (luminance(`#${color!}`) >= DARK_BELOW) return null;
  return `${base}/${ON_DARK}${tail}`;
}
