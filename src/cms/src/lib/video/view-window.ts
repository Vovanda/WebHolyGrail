/**
 * Что считается просмотром.
 *
 * @remarks
 * Ключ спрашивают на каждый отрезок потока, поэтому просмотром считается первое
 * взятие ключа к записи в пределах окна, а не каждый запрос. Иначе право
 * на три просмотра сгорает за полминуты.
 *
 * Окно длиной в сутки: вернулся назавтра - второй просмотр, пересмотрел в тот же
 * вечер - тот же.
 */

/** Длина окна в секундах. */
export const VIEW_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Считать ли это взятие ключа новым просмотром.
 *
 * @param lastTakenAt - когда зритель брал ключ к этой записи в прошлый раз,
 *   в секундах; `null` - не брал вовсе.
 * @param nowSeconds - текущее время в секундах.
 */
export function countsAsView(lastTakenAt: number | null, nowSeconds: number): boolean {
  if (lastTakenAt === null) return true;
  return nowSeconds - lastTakenAt > VIEW_WINDOW_SECONDS;
}
