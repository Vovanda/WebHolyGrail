import type { VideoChapter } from 'contracts';

/**
 * Оглавление записи дорожкой, которую понимает плеер.
 *
 * @remarks
 * Плееры читают главы тем же форматом, что и субтитры, поэтому список из
 * админки превращается в дорожку прямо в браузере. Отдельный файл заводить
 * незачем: владелец правит главы строками, а не редактирует разметку.
 *
 * Адрес получается встроенным - файла на диске не появляется, и запрос никуда
 * не уходит.
 */
export function chaptersTrackUrl(
  chapters: ReadonlyArray<VideoChapter>,
  durationSeconds: number | null,
): string | null {
  if (chapters.length === 0) return null;

  const ordered = [...chapters].sort((a, b) => a.startSeconds - b.startSeconds);
  const lines = ['WEBVTT', ''];

  ordered.forEach((chapter, index) => {
    const next = ordered[index + 1];
    // Последняя глава тянется до конца записи. Длительность бывает неизвестна -
    // тогда берём час: плеер обрежет по настоящему концу сам.
    const end = next ? next.startSeconds : (durationSeconds ?? chapter.startSeconds + 3600);
    if (end <= chapter.startSeconds) return;
    lines.push(`${stamp(chapter.startSeconds)} --> ${stamp(end)}`, chapter.title, '');
  });

  if (lines.length <= 2) return null;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(lines.join(String.fromCharCode(10)))}`;
}

/** Время в виде `00:02:05.000` - так его читает формат дорожек. */
function stamp(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(whole / 3600)).padStart(2, '0');
  const m = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
  const s = String(whole % 60).padStart(2, '0');
  return `${h}:${m}:${s}.000`;
}
