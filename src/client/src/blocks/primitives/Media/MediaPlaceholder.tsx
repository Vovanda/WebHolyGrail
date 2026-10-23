import { cn } from '@/lib/utils';

/**
 * MediaPlaceholder - место картинки, когда картинки нет: нейтральное поле с иконкой.
 *
 * @remarks
 * Заполняет отведённую ему область целиком, высоту задаёт тот, кто его ставит
 * (обычно рамка с `aspect-*`). Так соседние карточки и плитки не теряют высоту
 * и не показывают заглушку текстом «фото скоро». Часть: `media-placeholder`.
 */
export function MediaPlaceholder({
  size = 40,
  className,
}: {
  /** Размер иконки в точках. */
  readonly size?: number;
  readonly className?: string;
}) {
  return (
    <span
      data-part="media-placeholder"
      aria-hidden="true"
      className={cn(
        'flex h-full w-full items-center justify-center bg-surface-hover text-muted',
        className,
      )}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="10" r="1.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="m21 16-5-5-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
