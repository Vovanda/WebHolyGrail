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
    /*
      Плеер идёт в широком контейнере, а описание под ним — в узком: страница
      ролика это в первую очередь картинка, и зажимать её в колонку под текст
      значит оставить вокруг пустые поля. Текст же в широкой колонке нечитаем,
      поэтому ширины у них разные.
    */
    <main className="mx-auto flex max-w-wide flex-col gap-5 px-4 py-6 md:px-6 md:py-8">
      {token ? (
        <VideoPlayer
          src={video.playlistUrl}
          token={token}
          mediaId={video.id}
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

      <header className="flex max-w-content flex-col gap-2">
        <h1 className="text-h2 font-display font-semibold tracking-tight text-ink text-balance">
          {video.title}
        </h1>
        <p className="text-sm text-muted">
          <a href={`/@${video.channel}`} className="hover:text-ink hover:underline">
            @{video.channel}
          </a>
          {video.durationSeconds ? ` · ${formatDuration(video.durationSeconds)}` : ''}
        </p>
        {video.description && <Description text={video.description} />}
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

/**
 * Описание ролика с раскрытием.
 *
 * @remarks
 * Длинное описание занимает пол-экрана и отодвигает всё, что под ним, поэтому
 * показывается началом, а остаток раскрывается по нажатию.
 *
 * Без JS (R14): `details` умеет это сам. Текст при этом не дублируется —
 * начало живёт в заголовке, продолжение в теле, — иначе поисковик видел бы
 * описание дважды.
 */
function Description({ text }: { text: string }) {
  const { head, tail } = splitForPreview(text, 240);

  if (!tail) {
    return <p className="whitespace-pre-line text-body leading-relaxed text-ink/90">{text}</p>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer list-none whitespace-pre-line text-body leading-relaxed text-ink/90 [&::-webkit-details-marker]:hidden">
        {head}
        <span className="group-open:hidden">…</span>
        <span className="ml-1 whitespace-nowrap text-sm font-medium text-muted group-hover:text-ink group-open:hidden">
          ещё
        </span>
      </summary>
      <p className="whitespace-pre-line text-body leading-relaxed text-ink/90">{tail}</p>
      <span className="mt-1 inline-block cursor-pointer text-sm font-medium text-muted">
        свернуть
      </span>
    </details>
  );
}

/**
 * Делит текст на видимое начало и остаток.
 *
 * @remarks
 * Режем по границе слова: обрыв посреди слова читается как поломка вёрстки.
 * Если остаток совсем короткий, деление не имеет смысла — текст отдаётся целиком.
 */
function splitForPreview(text: string, limit: number): { head: string; tail: string } {
  if (text.length <= limit + 40) return { head: text, tail: '' };

  const space = text.lastIndexOf(' ', limit);
  const cut = space > limit / 2 ? space : limit;
  return { head: text.slice(0, cut), tail: text.slice(cut).trimStart() };
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
