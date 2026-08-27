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

/**
 * Строка плейлиста: ссылка на видео, а кадр лежит уже внутри самого видео.
 *
 * @remarks
 * Пока связь не раскрыта, вместо видео приходит его номер - тогда кадра нет
 * и строка пропускается.
 */
interface PlaylistRow {
  readonly video?:
    | { readonly preview?: { readonly url?: string | null } | null }
    | number
    | string
    | null;
}

/** Кадры для стопки: по порядку плейлиста, без повторов и пустот. */
export function playlistCovers(items: ReadonlyArray<unknown>): ReadonlyArray<string> {
  const seen = new Set<string>();

  for (const raw of items) {
    if (seen.size >= MAX_COVERS) break;

    const video = (raw as PlaylistRow | null)?.video;
    if (typeof video !== 'object' || video === null) continue;

    const url = video.preview?.url;
    if (typeof url !== 'string' || url.length === 0) continue;
    seen.add(url);
  }

  return [...seen];
}
