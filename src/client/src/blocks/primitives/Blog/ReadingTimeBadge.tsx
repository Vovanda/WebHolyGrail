import { cn } from '@/lib/utils';

/**
 * ReadingTimeBadge — "5 мин" с маленькой иконкой часов опционально.
 */
export interface ReadingTimeBadgeProps {
  readonly minutes: number;
  readonly className?: string;
}

export function ReadingTimeBadge({ minutes, className }: ReadingTimeBadgeProps) {
  return (
    <span className={cn('text-muted', className)} aria-label={`Время чтения: ${minutes} минут`}>
      {minutes} мин
    </span>
  );
}
