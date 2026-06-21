import { cn } from '@/lib/utils';

/**
 * PhotoCountBadge — бейдж «📷 N» в углу карточки. Показывается когда у
 * группы > 1 фото, как индикатор «нажми чтоб открыть всё».
 *
 * @remarks
 * Server-component (нет state). Позиционируется через `absolute` — родитель
 * должен быть `relative`.
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
        'bg-ink/75 text-paper text-[12px] font-semibold leading-none',
        'shadow-[0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-sm',
        'pointer-events-none',
        className,
      )}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <path d="M7 7l3 3 4-4" />
        <rect x="7" y="7" width="14" height="14" rx="2" opacity="0.55" />
      </svg>
      {count}
    </span>
  );
}
