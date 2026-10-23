'use client';

/**
 * Счётчик количества: минус, число, плюс.
 *
 * @remarks
 * Один на корзину и карточку витрины, чтобы оба места выглядели и вели себя
 * одинаково. Сам ничего не хранит: число приходит снаружи, нажатие сообщает
 * новое значение через `onChange`. Ноль - сигнал убрать позицию, решает тот,
 * кто ставит счётчик. Плюс гаснет на пределе `max` (остаток или штучная).
 */
export function QuantityStepper({
  value,
  max,
  title,
  onChange,
}: {
  readonly value: number;
  readonly max: number;
  /** Название позиции - для подписи кнопок скринридеру. */
  readonly title: string;
  readonly onChange: (next: number) => void;
}) {
  return (
    <div data-part="stepper" className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Меньше: ${title}`}
        className={stepButton}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span
        data-part="stepper-value"
        aria-live="polite"
        className="w-8 text-center tabular-nums text-ink"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Больше: ${title}`}
        disabled={value >= max}
        className={stepButton}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

const stepButton =
  'flex h-11 w-11 items-center justify-center rounded-md border border-border text-lg text-ink transition-colors hover:bg-surface-hover disabled:opacity-40';
