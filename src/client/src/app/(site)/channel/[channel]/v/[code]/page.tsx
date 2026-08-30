import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { AccessCodeForm } from '@/blocks/primitives/Video/AccessCodeForm';
import { VideoPlayer } from '@/blocks/primitives/Video/VideoPlayer';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { VideoDescription } from '@/blocks/primitives/Video/VideoDescription';
import { VideoSetLinks } from '@/blocks/primitives/Video/VideoSetLinks';
import { VideoShareTimecode } from '@/blocks/primitives/Video/VideoShareTimecode';
import { VideoSetStrip } from '@/blocks/primitives/Video/VideoSetStrip';
import {
  checkVideoAccess,
  getViewerName,
  getPlaylistByCode,
  getVideoByCode,
  issueVideoToken,
} from '@/lib/api-client';

/**
 * Страница видео: `/@<канал>/v/<код>`.
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
  // Токен нужен и для отказа: в него дописывается плейлист, когда зритель вводит код.
  const token = video.status === 'ready' ? await issueVideoToken() : null;
  const playable = access.allowed && video.status === 'ready';

  /*
    Плейлист, из которого пришли, показывается под видео: смотрят подряд, и
    возвращаться назад за следующим — лишний шаг.

    Какой именно плейлист, знает адрес: видео может состоять в нескольких, и без
    этого пришлось бы выбирать наугад.
  */
  const setParam = (await searchParams)['set'];
  const setCode = typeof setParam === 'string' ? setParam : null;
  const set = setCode ? await getPlaylistByCode(channel, setCode, cookie) : null;

  /*
    Подпись поверх кадра ставим только на закрытые записи: открытую и так
    смотрят без условий, портить её посторонним текстом незачем.

    Вошедший подписан своей почтой, незнакомец - коротким отпечатком выданного
    ему токена: слив тогда всё равно приводит к конкретному доступу.
  */
  const watermark =
    video.access === 'private'
      ? ((await getViewerName(cookie)) ?? (token ? `#${token.slice(0, 6)}` : null))
      : null;

  return (
    /*
      Плеер идёт в широком контейнере, а описание под ним — в узком: страница
      видео это в первую очередь картинка, и зажимать её в колонку под текст
      значит оставить вокруг пустые поля. Текст же в широкой колонке нечитаем,
      поэтому ширины у них разные.
    */
    <main className="mx-auto flex max-w-wide flex-col gap-8 px-4 py-8 md:gap-10 md:px-6 md:py-12">
      {/*
        Путь до записи: канал, плейлист, сама запись. Пришедший по прямой ссылке
        иначе не понимает, где оказался и что рядом.
      */}
      <Breadcrumbs
        items={[
          { label: video.authorName ?? `@${channel}`, href: `/@${channel}` },
          ...(set ? [{ label: set.title, href: `/@${channel}/p/${set.code ?? setCode}` }] : []),
          { label: video.title },
        ]}
        copyLink
      />

      {playable && token ? (
        <VideoPlayer
          mini
          watermark={watermark ?? undefined}
          subtitles={video.subtitles}
          storyboard={video.storyboard}
          chapters={video.chapters}
          durationSeconds={video.durationSeconds}
          src={video.playlistUrl}
          mediaId={video.id}
          poster={video.poster?.url}
          title={video.title}
        />
      ) : (
        <div className="border-border bg-surface relative flex aspect-video flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border px-6 text-center">
          {/*
            Кадр под формой - тот же, что виден затемнённым на карточке. Без него
            на месте плеера серый прямоугольник, и человек не понимает, что ему
            предлагают открыть.

            Картинка обычная, а не фоном в стиле: адрес приходит с записью,
            и инлайновый стиль перебил бы правку владельца через «Вид блока».
          */}
          {video.poster?.url && (
            <>
              {/*
                Картинкой фона, а не тегом img: пропавший кадр тогда просто
                не рисуется, тогда как img на его месте показывает значок
                битого файла - хуже, чем пустая подложка.
              */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center opacity-25"
                style={{ backgroundImage: `url(${video.poster.url})` }}
              />
              {/* Затемнение поверх кадра: иначе текст теряется на светлых местах. */}
              <div aria-hidden="true" className="bg-surface/60 absolute inset-0" />
            </>
          )}

          <p className="text-body text-ink relative">
            {video.status !== 'ready'
              ? 'Видео готовится к показу'
              : video.openableByCode
                ? 'Видео открывается по коду доступа'
                : 'Видео доступно не всем'}
          </p>

          {/*
            Код принимается прямо здесь: человек упёрся в замок именно тут,
            и отправлять его на другую страницу за тем же действием незачем.

            Но только когда есть чем открыть. Если живого кода на эту запись
            нет, поле предлагает ввести несуществующее - человек перебирает
            варианты и уходит с мыслью, что сайт сломан.
          */}
          {video.status === 'ready' && video.openableByCode && token && (
            <AccessCodeForm className="relative w-full max-w-sm" />
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
            Из плейлиста «
            <a
              href={`/@${channel}/p/${set.code ?? setCode}`}
              className="hover:underline underline-offset-4"
            >
              {set.title}
            </a>
            »
          </h2>

          <VideoSetStrip
            items={set.items}
            channel={channel}
            setCode={set.code ?? setCode}
            currentCode={code}
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
        обычной страницей, без обложки и длительности — то есть видео
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
