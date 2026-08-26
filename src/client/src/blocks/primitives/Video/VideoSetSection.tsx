import { headers } from 'next/headers';
import type { BlockNode, VideoSetBlockData, VideoSetItem } from 'contracts';

import { getPlaylistById } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/**
 * VideoSetSection — набор роликов на произвольной странице.
 *
 * @remarks
 * Серверный (R14): замок у каждого ролика считается по конкретному зрителю,
 * поэтому список собирается при показе, а не берётся из кеша страницы.
 *
 * Закрытые ролики из списка не убираются: состав набора — его витрина, и по
 * названию с обложкой видно, что человек получит. Играть закрытый всё равно не
 * начнёт, ключ выдаётся отдельно и по тем же правилам.
 */
export interface VideoSetSectionProps {
  readonly node: BlockNode;
  readonly className?: string;
}

export async function VideoSetSection({ node, className }: VideoSetSectionProps) {
  const data = (node.data ?? {}) as unknown as VideoSetBlockData;

  const playlistId =
    typeof data.playlist === 'object' && data.playlist !== null
      ? data.playlist.id
      : (data.playlist ?? null);
  if (!playlistId) return null;

  // Куки зрителя пробрасываем: без них вошедший выглядит анонимом, и его
  // открытые ролики показались бы закрытыми.
  const cookie = (await headers()).get('cookie') ?? '';
  const playlist = await getPlaylistById(playlistId, cookie);
  if (!playlist) return null;

  const items = data.limit ? playlist.items.slice(0, data.limit) : playlist.items;
  const heading = data.heading?.trim() || playlist.title;
  const subtitle = data.subtitle?.trim() || playlist.description;
  const setUrl =
    playlist.channel && playlist.code ? `/@${playlist.channel}/p/${playlist.code}` : null;
  const hidden = playlist.items.length - items.length;

  return (
    <section className={cn('flex flex-col gap-5', className)}>
      <header className="flex flex-col gap-2">
        <h2 className="text-h3 font-display font-semibold tracking-tight text-ink text-balance">
          {heading}
        </h2>
        {subtitle && <p className="text-body leading-relaxed text-ink/90">{subtitle}</p>}
      </header>

      {items.length === 0 ? (
        <p className="text-body text-muted">В наборе пока нет роликов.</p>
      ) : data.layout === 'grid' ? (
        <div className="grid gap-5 md:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
          {items.map((item) => (
            <Tile key={item.code} item={item} channel={playlist.channel} />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <Row key={item.code} item={item} index={index + 1} channel={playlist.channel} />
          ))}
        </ol>
      )}

      {data.showLink !== false && setUrl && (
        <a href={setUrl} className="text-sm font-medium text-muted hover:text-ink hover:underline">
          {hidden > 0 ? `Ещё ${hidden} в наборе →` : 'Весь набор →'}
        </a>
      )}
    </section>
  );
}

/** Плитка: когда важнее обложка, чем порядок. */
function Tile({ item, channel }: { item: VideoSetItem; channel: string | null }) {
  const playable = !item.locked && item.ready;
  const href = channel ? `/@${channel}/v/${item.code}` : null;

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-paper transition-colors',
        playable ? 'hover:border-border-strong' : 'opacity-70',
      )}
    >
      <Poster item={item} />
      <h3 className="p-4 text-body font-medium leading-snug text-ink text-balance">
        {playable && href ? (
          <a
            href={href}
            className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-4"
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>
      {!playable && <p className="px-4 pb-4 text-sm text-muted">{lockText(item)}</p>}
    </article>
  );
}

/** Строка: когда роликов много и важен порядок просмотра. */
function Row({
  item,
  index,
  channel,
}: {
  item: VideoSetItem;
  index: number;
  channel: string | null;
}) {
  const playable = !item.locked && item.ready;
  const href = channel ? `/@${channel}/v/${item.code}` : null;

  return (
    <li
      className={cn(
        'group relative flex items-center gap-4 rounded-xl border border-border bg-paper p-3 transition-colors',
        playable ? 'hover:border-border-strong' : 'opacity-70',
      )}
    >
      <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted">{index}</span>
      <div className="w-32 shrink-0 sm:w-40">
        <Poster item={item} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-body font-medium leading-snug text-ink text-balance">
          {playable && href ? (
            <a
              href={href}
              className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-4"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
        {!playable && (
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <LockIcon />
            {lockText(item)}
          </p>
        )}
      </div>
    </li>
  );
}

/** Обложка с замком и длительностью — общая для обоих видов списка. */
function Poster({ item }: { item: VideoSetItem }) {
  const playable = !item.locked && item.ready;

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface">
      {item.poster ? (
        <img
          src={item.poster}
          alt=""
          loading="lazy"
          className={cn('aspect-video w-full object-cover', playable ? '' : 'brightness-50')}
        />
      ) : (
        // Без обложки плитки в ряду разъезжаются по высоте.
        <div className="aspect-video w-full" aria-hidden="true" />
      )}

      {!playable && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white">
            <LockIcon size={16} />
          </span>
        </span>
      )}

      {item.durationSeconds ? (
        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-xs tabular-nums text-white">
          {formatDuration(item.durationSeconds)}
        </span>
      ) : null}
    </div>
  );
}

function lockText(item: VideoSetItem): string {
  if (!item.ready) return 'Готовится к показу';
  return item.lockReason === 'not-entitled' ? 'Открывается по доступу' : 'Откроется после входа';
}

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** «12:05» — привычный вид длительности. */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
