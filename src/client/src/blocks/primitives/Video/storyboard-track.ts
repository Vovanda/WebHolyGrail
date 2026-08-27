import type { VideoStoryboard } from 'contracts';

/**
 * Кадры для перемотки в виде дорожки, которую понимает плеер.
 *
 * @remarks
 * Плееры читают подсказки тем же форматом, что и субтитры: каждому отрезку
 * времени сопоставлен кусок общей картинки. Разметка собирается в браузере из
 * описания сетки, файла для неё не нужно.
 *
 * Кадры лежат одной картинкой: сотня отдельных файлов означала бы сотню
 * запросов на каждое движение по полосе.
 */
export function storyboardTrackUrl(board: VideoStoryboard | null | undefined): string | null {
  if (!board?.url || board.count < 1) return null;

  const lines = ['WEBVTT', ''];

  for (let index = 0; index < board.count; index += 1) {
    const from = index * board.intervalSeconds;
    const to = (index + 1) * board.intervalSeconds;
    const x = (index % board.columns) * board.frameWidth;
    const y = Math.floor(index / board.columns) * board.frameHeight;
    lines.push(
      `${stamp(from)} --> ${stamp(to)}`,
      `${board.url}#xywh=${x},${y},${board.frameWidth},${board.frameHeight}`,
      '',
    );
  }

  return `data:text/vtt;charset=utf-8,${encodeURIComponent(lines.join(String.fromCharCode(10)))}`;
}

/** Время в виде `00:02:05.000` - так его читает формат дорожек. */
function stamp(seconds: number): string {
  const whole = Math.max(0, seconds);
  const h = String(Math.floor(whole / 3600)).padStart(2, '0');
  const m = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(whole % 60)).padStart(2, '0');
  const ms = String(Math.round((whole % 1) * 1000)).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}
