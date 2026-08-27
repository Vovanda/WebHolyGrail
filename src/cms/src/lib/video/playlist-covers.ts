/**
 * Чем плейлисту показаться, когда своей обложки нет.
 *
 * @remarks
 * Пустое место там, где у соседей картинка, читается как поломка. Поэтому
 * берём кадры самих видео и показываем их стопкой со сдвигом: сразу видно,
 * что это подборка, а не одно видео.
 *
 * Больше трёх кадров не берём: в стопке они всё равно перекрывают друг друга,
 * а лишние адреса утяжеляют ответ на ровном месте.
 *
 * Видео без кадра пропускаем - в стопке дырка заметнее, чем стопка потоньше.
 */

/** Сколько кадров показывать в стопке. */
const MAX_COVERS = 3;

interface WithPreview {
  readonly preview?: { readonly url?: string | null } | null;
}

/** Кадры для стопки: по порядку плейлиста, без повторов и пустот. */
export function playlistCovers(items: ReadonlyArray<unknown>): ReadonlyArray<string> {
  const seen = new Set<string>();

  for (const raw of items) {
    if (seen.size >= MAX_COVERS) break;

    const url = (raw as WithPreview | null)?.preview?.url;
    if (typeof url !== 'string' || url.length === 0) continue;
    seen.add(url);
  }

  return [...seen];
}
