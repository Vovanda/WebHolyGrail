import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { AccessCodeForm } from '@/blocks/primitives/Video/AccessCodeForm';
import { VideoPlayer } from '@/blocks/primitives/Video/VideoPlayer';
import { VideoSetDrawer } from '@/blocks/primitives/Video/VideoSetDrawer';
import { VideoDescription } from '@/blocks/primitives/Video/VideoDescription';
import { VideoSetLinks } from '@/blocks/primitives/Video/VideoSetLinks';
import { VideoShareTimecode } from '@/blocks/primitives/Video/VideoShareTimecode';
import { VideoSetList } from '@/blocks/primitives/Video/VideoSetList';
import {
  checkVideoAccess,
  getPlaylistByCode,
  getVideoByCode,
  issueVideoToken,
} from '@/lib/api-client';

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

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { channel, code } = await params;
  const video = await getVideoByCode(channel, code);
  if (!video) notFound();

  const cookie = (await headers()).get('cookie') ?? '';
  const access = await checkVideoAccess(video.id, cookie);
  // Токен нужен и для отказа: в него дописывается набор, когда зритель вводит код.
  const token = video.status === 'ready' ? await issueVideoToken() : null;
  const playable = access.allowed && video.status === 'ready';

  /*
    Набор, из которого пришли, показывается под роликом: смотрят подряд, и
    возвращаться назад за следующим — лишний шаг.

    Какой именно набор, знает адрес: ролик может состоять в нескольких, и без
    этого пришлось бы выбирать наугад.
  */
  const setParam = (await searchParams)['set'];
  const setCode = typeof setParam === 'string' ? setParam : null;
  const set = setCode ? await getPlaylistByCode(channel, setCode, cookie) : null;

  return (
    /*
      Плеер идёт в широком контейнере, а описание под ним — в узком: страница
      ролика это в первую очередь картинка, и зажимать её в колонку под текст
      значит оставить вокруг пустые поля. Текст же в широкой колонке нечитаем,
      поэтому ширины у них разные.
    */
    <main className="mx-auto flex max-w-wide flex-col gap-5 px-4 py-6 md:px-6 md:py-8">
      {playable && token ? (
        <VideoPlayer
          mini
          subtitles={video.subtitles}
          chapters={video.chapters}
          durationSeconds={video.durationSeconds}
          src={video.playlistUrl}
          token={token}
          mediaId={video.id}
          poster={video.poster?.url}
          title={video.title}
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 text-center">
          <p className="text-body text-ink">
            {video.status !== 'ready'
              ? 'Видео готовится к показу'
              : 'Видео открывается по коду доступа'}
          </p>

          {/*
            Код принимается прямо здесь: человек упёрся в замок именно тут,
            и отправлять его на другую страницу за тем же действием незачем.
          */}
          {video.status === 'ready' && token && (
            <AccessCodeForm token={token} className="w-full max-w-sm" />
          )}
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

        {/* Поделиться с того места, где сейчас стоит запись. */}
        <VideoShareTimecode />
        {video.description && <VideoDescription text={video.description} />}
      </header>

      {set && set.items.length > 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-body font-medium text-ink">
            Из набора «
            <a
              href={`/@${channel}/p/${set.code ?? setCode}`}
              className="hover:underline underline-offset-4"
            >
              {set.title}
            </a>
            »
          </h2>

          {/*
            На узком экране список уезжает в боковую панель: лентой там видно
            два ролика из двадцати, а вертикалью он занял бы весь экран.
          */}
          <VideoSetDrawer
            items={set.items}
            channel={channel}
            setCode={set.code ?? setCode}
            currentCode={code}
            title={set.title}
            className="self-start md:hidden"
          />

          <VideoSetList
            items={set.items}
            channel={channel}
            setCode={set.code ?? setCode}
            currentCode={code}
            orientation="horizontal"
            className="hidden md:flex"
          />
        </section>
      )}

      {/*
        Второй перечень отвечает на другой вопрос: частью чего ещё является это
        видео. Линия отделяет его от списка выше - без неё два перечня подряд
        читаются как один длинный.
      */}
      {video.sets.length > 0 && (
        <>
          <hr className="border-border" />
          <VideoSetLinks
            sets={video.sets}
            channel={channel}
            currentSetCode={set?.code ?? setCode}
          />
        </>
      )}

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
