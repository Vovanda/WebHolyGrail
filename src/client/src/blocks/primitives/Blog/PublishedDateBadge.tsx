import { cn } from '@/lib/utils';

/**
 * PublishedDateBadge — meta-элемент. ISO-дата → локализованный формат
 * "30 июня 2026" (locale ru-RU).
 */
export interface PublishedDateBadgeProps {
  readonly date: string;
  readonly className?: string;
}

export function PublishedDateBadge({ date, className }: PublishedDateBadgeProps) {
  const d = new Date(date);
  const formatted = d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <time dateTime={date} className={cn('text-muted', className)} title={d.toISOString()}>
      {formatted}
    </time>
  );
}
