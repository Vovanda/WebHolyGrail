import type { BlockNode, MediaDoc, MediaRef } from 'contracts';

/**
 * Картинка превью страницы для мессенджеров и поисковиков (og:image).
 *
 * @remarks
 * Порядок: своя картинка из настроек страницы, иначе первая картинка
 * в её блоках по порядку показа - баннер, фото Hero, иллюстрация карточки,
 * иначе запасная (логотип сайта). Без картинки ссылка в мессенджере
 * показывается голым адресом.
 *
 * Векторная картинка не годится: мессенджеры её не показывают.
 */
export function pageShareImage(
  own: MediaRef | null | undefined,
  blocks: readonly BlockNode[],
  fallback: MediaRef | null | undefined,
): MediaDoc | null {
  if (isRaster(own)) return own;
  for (const block of blocks) {
    const found = firstImage(block);
    if (found) return found;
  }
  return isRaster(fallback) ? fallback : null;
}

function isRaster(ref: unknown): ref is MediaDoc {
  if (!ref || typeof ref !== 'object') return false;
  const media = ref as Partial<MediaDoc>;
  if (typeof media.url !== 'string' || !media.url) return false;
  const type = media.mimeType ?? '';
  return type.startsWith('image/') && type !== 'image/svg+xml';
}

/** Первая картинка в данных блока, обход в глубину по порядку полей. */
function firstImage(value: unknown, depth = 0): MediaDoc | null {
  if (depth > 8 || !value || typeof value !== 'object') return null;
  if (isRaster(value)) return value;
  const children = Array.isArray(value) ? value : Object.values(value);
  for (const child of children) {
    const found = firstImage(child, depth + 1);
    if (found) return found;
  }
  return null;
}
