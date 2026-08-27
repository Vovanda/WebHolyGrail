import type { VideoSetRef } from 'contracts';

import { cn } from '@/lib/utils';

import { PlaylistCard } from './PlaylistCard';

/**
 * Плейлисты, в которые входит это видео.
 *
 * @remarks
 * Второй перечень на странице видео. Первый показывает соседей по плейлисту, из
 * которого зритель пришёл; этот отвечает на другой вопрос - частью чего ещё
 * является видео. Пришедшему по прямой ссылке он даёт первый шаг дальше.
 *
 * Плейлист, открытый прямо сейчас, отсюда убирается: он уже показан выше списком
 * своих видео.
 */
export interface VideoSetLinksProps {
  readonly sets: ReadonlyArray<VideoSetRef>;
  readonly channel: string;
  /** Плейлист, показанный выше: его здесь не повторяем. */
  readonly currentSetCode?: string | null;
  readonly className?: string;
}

export function VideoSetLinks({ sets, channel, currentSetCode, className }: VideoSetLinksProps) {
  const others = sets.filter((set) => set.code && set.code !== currentSetCode);
  if (others.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h2 data-part="title" className="text-body font-medium text-ink">
        Это видео входит в плейлисты
      </h2>

      {/* Та же сетка, что на канале: карточки не расходятся по ширине от места
          к месту. */}
      <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
        {others.map((set) => (
          <li key={set.id} className="contents">
            <PlaylistCard set={set} channel={channel} />
          </li>
        ))}
      </ul>
    </section>
  );
}
