import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getPlaylistByCode, type PlaylistItem } from '@/lib/api-client';

/**
 * Страница набора: `/@<канал>/p/<код>`.
 *
 * @remarks
 * Состав набора — его витрина, поэтому закрытые ролики здесь видны, но с
 * замком: название и обложка говорят, что внутри, а играть ролик не начнёт —
 * конверт выдаётся отдельно и по тем же правилам.
 *
 * Рендерится на сервере (R14): замок зависит от прав конкретного зрителя, и
 * собранная в браузере страница показала бы всем одно и то же.
 */
type Params = { channel: string; code: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { channel, code } = await params;
  const playlist = await getPlaylistByCode(channel, code, '');
  if (!playlist) return { title: 'Набор не найден' };

  return {
    title: playlist.title,
    description: playlist.description ?? undefined,
    openGraph: {
      title: playlist.title,
      description: playlist.description ?? undefined,
      images: playlist.cover ? [playlist.cover] : undefined,
    },
  };
}

export default async function PlaylistPage({ params }: { params: Promise<Params> }) {
  const { channel, code } = await params;
  const cookie = (await headers()).get('cookie') ?? '';
  const playlist = await getPlaylistByCode(channel, code, cookie);
  if (!playlist) notFound();

  const openCount = playlist.items.filter((item) => !item.locked).length;

  return (
    <main className="mx-auto flex max-w-wide flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
        {playlist.cover ? (
          <img
            src={playlist.cover}
            alt=""
            className="aspect-video w-full rounded-xl object-cover md:w-72"
          />
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="text-h2 font-display font-semibold tracking-tight text-ink text-balance">
            {playlist.title}
          </h1>
          <p className="text-sm text-muted">
            <a href={`/@${playlist.channel}`} className="hover:text-ink hover:underline">
              {playlist.authorName ?? `@${playlist.channel}`}
            </a>
            {` · ${playlist.items.length} ${plural(playlist.items.length, 'ролик', 'ролика', 'роликов')}`}
            {openCount < playlist.items.length ? ` · ${openCount} открыто` : ''}
          </p>
          {playlist.description && (
            <p className="text-body leading-relaxed text-ink/90">{playlist.description}</p>
          )}
        </div>
      </header>

      {playlist.items.length === 0 ? (
        <p className="text-body text-muted">В наборе пока нет роликов.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {playlist.items.map((item, index) => (
            <PlaylistItemRow
              key={item.code}
              item={item}
              index={index + 1}
              channel={playlist.channel}
            />
          ))}
        </ol>
      )}
    </main>
  );
}

/**
 * Строка ролика в наборе.
 *
 * @remarks
 * Закрытый ролик не ссылка: вести на страницу, где вместо плеера заглушка, —
 * значит обещать просмотр и не давать его. Причина замка написана прямо здесь.
 */
function PlaylistItemRow({
  item,
  index,
  channel,
}: {
  item: PlaylistItem;
  index: number;
  channel: string;
}) {
  const playable = !item.locked && item.ready;

  return (
    <li
      className={`group relative flex items-center gap-4 rounded-xl border border-border bg-paper p-3 transition-colors ${
        playable ? 'hover:border-border-strong' : 'opacity-70'
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted">{index}</span>

      <div className="relative w-32 shrink-0 overflow-hidden rounded-lg bg-surface sm:w-40">
        {item.poster ? (
          <img
            src={item.poster}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="aspect-video w-full" aria-hidden="true" />
        )}
        {item.durationSeconds ? (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-xs tabular-nums text-white">
            {formatDuration(item.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-body font-medium leading-snug text-ink text-balance">
          {playable ? (
            <a
              href={`/@${channel}/v/${item.code}`}
              className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-4"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h2>
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

function lockText(item: PlaylistItem): string {
  if (!item.ready) return 'Готовится к показу';
  return item.lockReason === 'not-entitled' ? 'Нужен доступ к набору' : 'Доступно после входа';
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
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

/** «3 ролика», «5 роликов» — иначе счётчик читается как машинный. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
