import type { VideoSetItem } from 'contracts';

/**
 * Какое видео плейлиста показывать.
 *
 * @remarks
 * Выбор живёт в адресе, а не в состоянии плеера. Так ссылка на нужное видео
 * работает сама собой, «назад» возвращает к предыдущему, а перезагрузка не
 * сбрасывает место.
 *
 * Это же развязывает плеер и список: они могут стоять в разных концах страницы
 * и даже в разных ветках разметки - панель сбоку собирает лейаут, а плеер
 * приходит блоком, - и всё равно показывать одно и то же.
 *
 * Закрытые и ещё не нарезанные пропускаем: стрелка или ссылка, ведущая на
 * замок, обрывает просмотр там, где человек ждал продолжения.
 */

/** Имя в адресе. Короткое, потому что попадает в ссылки, которыми делятся. */
export const VIDEO_PARAM = 'v';

/** Те видео плейлиста, которые действительно заиграют. */
export function playableOf(items: ReadonlyArray<VideoSetItem>): ReadonlyArray<VideoSetItem> {
  return items.filter((item) => !item.locked && item.ready && item.playlistUrl);
}

/**
 * Видео по коду из адреса.
 *
 * @remarks
 * Кода нет, он чужой или ведёт на закрытое - берём первое, что может играть:
 * человек пришёл смотреть плейлист, и пустой кадр вместо него выглядит
 * поломкой.
 */
export function selectVideo(
  items: ReadonlyArray<VideoSetItem>,
  code: string | null | undefined,
): VideoSetItem | null {
  const playable = playableOf(items);
  if (playable.length === 0) return null;

  const asked = code ? playable.find((item) => item.code === code) : undefined;
  return asked ?? playable[0] ?? null;
}

/** Соседи текущего видео среди играющих. */
export function neighboursOf(
  items: ReadonlyArray<VideoSetItem>,
  current: VideoSetItem | null,
): { readonly prev?: VideoSetItem; readonly next?: VideoSetItem } {
  const playable = playableOf(items);
  const at = current ? playable.findIndex((item) => item.id === current.id) : -1;
  if (at < 0) return {};

  const prev = at > 0 ? playable[at - 1] : undefined;
  const next = at < playable.length - 1 ? playable[at + 1] : undefined;
  return { ...(prev ? { prev } : {}), ...(next ? { next } : {}) };
}
