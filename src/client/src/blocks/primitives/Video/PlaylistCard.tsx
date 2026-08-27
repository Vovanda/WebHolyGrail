import type { VideoSetRef } from 'contracts';

import { cn } from '@/lib/utils';

import { PlaylistCover } from './PlaylistCover';

/**
 * Плейлист карточкой: обложка, название и сколько внутри видео.
 *
 * @remarks
 * Одна и та же карточка стоит на канале и на странице видео. Строкой текста
 * плейлист там уже был, и владелец на это указал: рядом с карточками записей
 * строка читается как сноска, а не как то, что можно открыть.
 */
export interface PlaylistCardProps {
  readonly set: VideoSetRef;
  readonly channel: string;
  /** Пояснение под названием, если оно есть. */
  readonly description?: string | null;
  readonly className?: string;
}

export function PlaylistCard({ set, channel, description, className }: PlaylistCardProps) {
  if (!set.code) return null;

  return (
    <a
      href={`/@${channel}/p/${set.code}`}
      data-part="card"
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-paper',
        'transition-colors hover:border-border-strong',
        className,
      )}
    >
      <PlaylistCover cover={set.cover ?? null} covers={set.covers ?? []} />

      <span className="flex flex-col gap-1 p-4">
        <span
          data-part="card-title"
          className="text-body font-medium leading-snug text-ink text-balance"
        >
          {set.title}
        </span>
        <span data-part="card-caption" className="text-sm text-muted">
          {set.count} видео
        </span>
        {description && (
          <span data-part="card-subtitle" className="line-clamp-2 text-sm text-muted">
            {description}
          </span>
        )}
      </span>
    </a>
  );
}
