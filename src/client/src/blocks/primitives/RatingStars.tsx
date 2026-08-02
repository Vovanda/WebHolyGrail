/**
 * RatingStars — оценка звёздами.
 *
 * @remarks
 * Server-only (R14): разметка статична, состояния нет.
 *
 * Дробная оценка показывается обрезкой по ширине, а не округлением до целой
 * звезды: 4.5 и 5.0 должны отличаться на вид, иначе шкала врёт в пользу
 * нижнего значения.
 *
 * Звёзды помечены `aria-hidden`, рядом лежит текстовая оценка для скринридера —
 * пять одинаковых символов подряд читаются как мусор.
 */
export function RatingStars({
  value,
  max = 5,
  showValue = false,
}: {
  readonly value: number;
  readonly max?: number;
  /** Число рядом со звёздами. В плотных карточках лишнее, на странице — уместно. */
  readonly showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const percent = (clamped / max) * 100;
  const stars = '★'.repeat(max);

  return (
    <span className="inline-flex items-center gap-1.5 leading-none">
      <span
        className="relative inline-block text-base tracking-[0.1em] text-border"
        aria-hidden="true"
      >
        {stars}
        <span
          className="absolute inset-y-0 left-0 overflow-hidden text-accent"
          style={{ width: `${percent}%` }}
        >
          {stars}
        </span>
      </span>
      {showValue && <span className="text-sm text-muted">{clamped.toFixed(1)}</span>}
      <span className="sr-only">
        Оценка {clamped.toFixed(1)} из {max}
      </span>
    </span>
  );
}
