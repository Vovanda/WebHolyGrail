import type { VideoSetRef } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * Наборы, в которые входит это видео.
 *
 * @remarks
 * Второй перечень на странице видео. Первый показывает соседей по набору, из
 * которого зритель пришёл; этот отвечает на другой вопрос - частью чего ещё
 * является видео. Пришедшему по прямой ссылке он даёт первый шаг дальше.
 *
 * Набор, открытый прямо сейчас, отсюда убирается: он уже показан выше списком
 * своих видео.
 */
export interface VideoSetLinksProps {
  readonly sets: ReadonlyArray<VideoSetRef>;
  readonly channel: string;
  /** Набор, показанный выше: его здесь не повторяем. */
  readonly currentSetCode?: string | null;
  readonly className?: string;
}

export function VideoSetLinks({ sets, channel, currentSetCode, className }: VideoSetLinksProps) {
  const others = sets.filter((set) => set.code && set.code !== currentSetCode);
  if (others.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h2 className="text-body font-medium text-ink">Это видео входит в наборы</h2>

      <ul className="flex flex-wrap gap-2">
        {others.map((set) => (
          <li key={set.id}>
            <a
              href={`/@${channel}/p/${set.code}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-paper px-3 py-2 text-body text-ink transition-colors hover:border-border-strong"
            >
              {set.title}
              <span className="text-sm text-muted">{plural(set.count)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** «1 видео», «2 видео», «5 видео» - слово не меняется, меняется только число. */
function plural(count: number): string {
  return `${count} видео`;
}
