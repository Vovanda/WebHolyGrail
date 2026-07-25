import { cn } from '@/lib/utils';

/**
 * PublishedDateBadge — meta-элемент. ISO-дата → «30 июня 2026».
 *
 * @remarks
 * Хвост «г.», который `toLocaleDateString` добавляет для ru-RU, срезаем: в
 * строке меты рядом с именем автора он читается как опечатка, а не как часть
 * даты.
 */
export interface PublishedDateBadgeProps {
  readonly date: string;
  readonly className?: string;
}

export function PublishedDateBadge({ date, className }: PublishedDateBadgeProps) {
  const d = new Date(date);
  const formatted = d
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(/\s*г\.$/, '');
  return (
    <time dateTime={date} className={cn('text-muted', className)} title={d.toISOString()}>
      {formatted}
    </time>
  );
}
