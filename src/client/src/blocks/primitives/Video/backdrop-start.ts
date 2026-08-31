/**
 * С какой секунды начать фоновую запись.
 *
 * @remarks
 * Обложка живёт на странице долго, и запись успевает пройти круг не один раз.
 * Начинаясь всегда с нуля, она превращается в узнаваемую петлю: посетитель
 * второй раз видит тот же кадр на том же месте и перестаёт читать её как
 * съёмку. Случайное начало убирает это ощущение, не трогая саму запись.
 *
 * Хвост оставляется намеренно: точка у самого конца дала бы полсекунды
 * картинки и сразу повтор - мигание вместо фона.
 *
 * Короткая запись остаётся с начала: делить нечего, а прыжок по ней заметнее
 * самой записи.
 */
export interface StartOptions {
  /** Сколько секунд должно остаться после точки, иначе начинаем сначала. */
  readonly tail?: number;
  /** Источник случайности: в проверке подменяется на предсказуемый. */
  readonly random?: () => number;
}

export function pickStart(duration: number, options: StartOptions = {}): number {
  const tail = options.tail ?? 8;
  const random = options.random ?? Math.random;

  if (!Number.isFinite(duration) || duration <= 0) return 0;

  const room = duration - tail;
  if (room <= 0) return 0;

  return Math.max(0, Math.min(room, random() * room));
}
