import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { VideoPlayer } from '@/blocks/primitives/Video/VideoPlayer';
import { checkVideoAccess, getVideoByCode, issueVideoToken } from '@/lib/api-client';

/**
 * Страница ролика: `/@<канал>/v/<код>`.
 *
 * @remarks
 * Наружу адрес выглядит как `/@канал/v/код` — внутрь его переписывает
 * `next.config`: папку с `@` Next трактует как параллельный маршрут.
 *
 * Рендерится на сервере (R14) не только ради скорости: прямая ссылка обязана
 * отдавать поисковику готовую карточку с обложкой и длительностью, а
 * мессенджеру — превью. Собранная в браузере страница не даёт ни того, ни
 * другого.
 */
type Params = { channel: string; code: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { channel, code } = await params;
  const video = await getVideoByCode(channel, code);
  if (!video) return { title: 'Видео не найдено' };

  const image = video.poster?.url;
  return {
    title: video.title,
    description: video.description ?? undefined,
    openGraph: {
      title: video.title,
      description: video.description ?? undefined,
      type: 'video.other',
      images: image ? [image] : undefined,
    },
    // Закрытое в поиск не отдаём: карточка в выдаче обещала бы просмотр,
    // которого не будет.
    robots: video.access === 'private' ? { index: false, follow: false } : undefined,
  };
}

export default async function VideoPage({ params }: { params: Promise<Params> }) {
  const { channel, code } = await params;
  const video = await getVideoByCode(channel, code);
  if (!video) notFound();

  const cookie = (await headers()).get('cookie') ?? '';
  const access = await checkVideoAccess(video.id, cookie);
  const token = access.allowed && video.status === 'ready' ? await issueVideoToken() : null;

  return (
    <main className="mx-auto flex max-w-content flex-col gap-5 px-4 py-8 md:px-6 md:py-12">
      {token ? (
        <VideoPlayer
          src={video.playlistUrl}
          token={token}
          mediaId={video.id}
          cmsUrl={process.env['NEXT_PUBLIC_CMS_URL'] ?? ''}
          poster={video.poster?.url}
          title={video.title}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-surface px-6 text-center">
          <p className="text-body text-muted">
            {video.status !== 'ready'
              ? 'Видео готовится к показу'
              : access.reason === 'not-entitled'
                ? 'Видео входит в платный набор'
                : 'Видео доступно после входа'}
          </p>
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="text-h2 font-display font-semibold tracking-tight text-ink text-balance">
          {video.title}
        </h1>
        <p className="text-sm text-muted">
          <a href={`/@${video.channel}`} className="hover:text-ink hover:underline">
            @{video.channel}
          </a>
          {video.durationSeconds ? ` · ${formatDuration(video.durationSeconds)}` : ''}
        </p>
        {video.description && (
          <p className="text-body leading-relaxed text-ink/90">{video.description}</p>
        )}
      </header>

      {/*
        Разметка для поисковика. Без неё прямая ссылка выглядит в выдаче
        обычной страницей, без обложки и длительности — то есть ролик
        практически не находится.
      */}
      {video.access === 'public' && (
        <script
          type="application/ld+json"
          // Значения собраны на сервере из своей же базы, посторонней строки
          // здесь оказаться неоткуда.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'VideoObject',
              name: video.title,
              description: video.description ?? video.title,
              thumbnailUrl: video.poster?.url ? [video.poster.url] : undefined,
              duration: video.durationSeconds ? toIsoDuration(video.durationSeconds) : undefined,
              contentUrl: video.playlistUrl || undefined,
              author: { '@type': 'Person', name: `@${video.channel}` },
            }),
          }}
        />
      )}
    </main>
  );
}

/** «12:05» — привычный вид длительности рядом с названием. */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Длительность в том виде, в каком её ждёт разметка: `PT1M12S`. */
function toIsoDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `PT${minutes > 0 ? `${minutes}M` : ''}${rest}S`;
}
