import { cn } from '@/lib/utils';

/**
 * PhotoCountBadge — бейдж «📸 N фото» в правом верхнем углу карточки. Стиль
 * 1:1 с legacy `.veo-pup-card__badge`: black pill, font-sans, не uppercase.
 *
 * Показывается когда у группы > 1 фото, как индикатор «нажми чтоб открыть всё».
 * Родитель должен быть `relative` (позиционируется через `absolute`).
 *
 * Server-component (нет state).
 */
export function PhotoCountBadge({
  count,
  className,
}: {
  readonly count: number;
  readonly className?: string;
}) {
  if (count <= 1) return null;
  return (
    <span
      aria-hidden
      className={cn(
        'absolute top-2.5 right-2.5 z-10 inline-flex items-center gap-1',
        'px-2.5 py-1 rounded-full',
        'bg-black/65 text-white text-[11px] font-bold font-sans',
        'tracking-[0.3px] leading-none',
        'max-md:text-[10px] max-md:px-[7px] max-md:py-[3px] max-md:top-1.5 max-md:right-1.5',
        'pointer-events-none',
        className,
      )}
    >
      <span aria-hidden style={{ fontFamily: 'var(--font-emoji), inherit' }}>
        📸
      </span>
      {count} фото
    </span>
  );
}
