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

/**
 * Выбор в адресе, когда плейлистов на странице несколько.
 *
 * @remarks
 * Плейлист на странице бывает не один: подборка курса и подборка отзывов стоят
 * рядом, и у каждой свой плеер. С одним общим значением они дерутся: переключил
 * видео в первой - вторая своего кода в адресе не находит и сбрасывается на
 * первое видео, хотя её никто не трогал.
 *
 * Поэтому значение подписано плейлистом: `v=<плейлист>:<видео>`, и параметр
 * может повторяться. Значение без подписи понимает любой плейлист - таким был
 * прежний вид адреса, и уже разосланные ссылки должны продолжать работать.
 */
const PAIR_SEPARATOR = ':';

/** Код видео для этого плейлиста, взятый из строки запроса. */
export function readSelection(search: string, setCode: string | null | undefined): string | null {
  const values = new URLSearchParams(search).getAll(VIDEO_PARAM);

  for (const value of values) {
    const at = value.indexOf(PAIR_SEPARATOR);
    if (at < 0) continue;
    if (value.slice(0, at) === setCode) return value.slice(at + 1) || null;
  }

  // Подписи нет - значение общее: так выглядели ссылки до появления второго
  // плейлиста на странице.
  const plain = values.find((value) => !value.includes(PAIR_SEPARATOR));
  return plain ?? null;
}

/**
 * Строка запроса с новым выбором.
 *
 * @remarks
 * Чужие значения остаются на месте: рядом стоящий плейлист не должен терять
 * своё видео от того, что переключили этот.
 */
export function writeSelection(
  search: string,
  setCode: string | null | undefined,
  videoCode: string,
): string {
  const params = new URLSearchParams(search);
  const mine = setCode ? `${setCode}${PAIR_SEPARATOR}${videoCode}` : videoCode;

  const others = params.getAll(VIDEO_PARAM).filter((value) => {
    const at = value.indexOf(PAIR_SEPARATOR);
    // Без подписи значение общее и заменяется своим: держать оба незачем.
    if (at < 0) return false;
    return value.slice(0, at) !== setCode;
  });

  params.delete(VIDEO_PARAM);
  for (const value of others) params.append(VIDEO_PARAM, value);
  params.append(VIDEO_PARAM, mine);

  return params.toString();
}

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
