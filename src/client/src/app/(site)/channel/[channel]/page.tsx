import { notFound } from 'next/navigation';

import { PlaylistCover } from '@/blocks/primitives/Video/PlaylistCover';
import { getChannel } from '@/lib/api-client';

/**
 * Канал участника: `/@<канал>`.
 *
 * @remarks
 * Не отдельная сущность, а страница автора: заводить «каналы» рядом с уже
 * существующими участниками значило бы держать два профиля на одного человека.
 *
 * Сейчас здесь только видео. Фото и статьи того же автора встанут сюда же,
 * когда дойдут — адрес для этого и выбран общий, а не `/videos/<автор>`.
 */
type Params = { channel: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { channel } = await params;
  const data = await getChannel(channel);
  if (!data) return { title: 'Канал не найден' };
  return {
    title: data.authorName ?? `@${data.channel}`,
    description: `Видео автора @${data.channel}`,
  };
}

export default async function ChannelPage({ params }: { params: Promise<Params> }) {
  const { channel } = await params;
  const data = await getChannel(channel);
  if (!data) notFound();

  return (
    <main className="mx-auto flex max-w-wide flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-h2 font-display font-semibold tracking-tight text-ink">
          {data.authorName ?? `@${data.channel}`}
        </h1>
        <p className="text-sm text-muted">@{data.channel}</p>
      </header>

      {/*
        Плейлисты идут перед отдельными записями: человек, попавший на канал, чаще
        ищет курс целиком, а не одну запись из середины.
      */}
      {data.sets.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-h4 font-display font-semibold tracking-tight text-ink">Плейлисты</h2>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {data.sets.map((set) => (
              <a
                key={set.code}
                href={`/@${data.channel}/p/${set.code}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-paper transition-colors hover:border-border-strong"
              >
                <PlaylistCover cover={set.cover} covers={set.covers ?? []} />

                <span className="flex flex-col gap-1 p-4">
                  <span className="text-body font-medium leading-snug text-ink text-balance">
                    {set.title}
                  </span>
                  <span className="text-sm text-muted">{set.count} видео</span>
                  {set.description && (
                    <span className="line-clamp-2 text-sm text-muted">{set.description}</span>
                  )}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {data.videos.length === 0 && data.sets.length === 0 && (
        <p className="text-body text-muted">Пока нет ни одной записи.</p>
      )}

      {data.videos.length > 0 && (
        <section className="flex flex-col gap-4">
          {data.sets.length > 0 && (
            <h2 className="text-h4 font-display font-semibold tracking-tight text-ink">Записи</h2>
          )}

          <div className="grid gap-5 md:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {data.videos.map((video) => (
              <article
                key={video.code}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-paper transition-colors hover:border-border-strong"
              >
                <div className="relative overflow-hidden bg-surface">
                  {video.poster ? (
                    <img
                      src={video.poster}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    // Без обложки плитки в ряду разъезжаются по высоте.
                    <div className="aspect-video w-full" aria-hidden="true" />
                  )}
                  {video.durationSeconds ? (
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs tabular-nums text-white">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  ) : null}
                </div>
                <h2 className="p-4 text-body font-medium leading-snug text-ink text-balance">
                  <a
                    href={`/@${data.channel}/v/${video.code}`}
                    className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-4"
                  >
                    {video.title}
                  </a>
                </h2>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
