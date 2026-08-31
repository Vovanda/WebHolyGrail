import { headers } from 'next/headers';
import type { BlockNode, VideoBlockData, SiteSettings } from 'contracts';

import { checkVideoAccess, getVideoStream } from '@/lib/api-client';
import { readVideoUi } from '@/lib/video-ui';
import { cn } from '@/lib/utils';

import { VideoPlayer } from './VideoPlayer';

/**
 * VideoSection — блок с плеером на странице.
 *
 * @remarks
 * Серверная часть (R14): забирает данные видео, право на просмотр и токен
 * зрителя, а браузеру достаётся только плеер.
 *
 * Право проверяется здесь, до отрисовки. Иначе закрытый видео показывал бы
 * обычный проигрыватель, а отказ всплывал только по нажатию «play» — зритель
 * читает это как поломку сайта, а не как закрытый доступ.
 */
export interface VideoSectionProps {
  readonly node: BlockNode;
  /** Настройки сайта: из них берётся заглушка отказа. */
  readonly settings: SiteSettings;
  readonly className?: string;
}

/** Текст отказа. Позже задаётся владельцем в настройках сайта. */
const DENIAL: Record<string, string> = {
  'not-entitled': 'Откроется по коду доступа',
  unavailable: 'Видео сейчас недоступно',
};

/**
 * Запись, которой на сайте больше нет.
 *
 * @remarks
 * Ссылка на неё остаётся в тексте статьи и на странице: там она вписана
 * вручную, и убрать её может только владелец. Молчать нельзя - блок исчезал
 * целиком, а между абзацами оставалась дыра, по которой не понять, потерялась
 * вёрстка или запись убрали. Поймано 31.08.2026 на витрине: у записи стояла
 * пометка об удалении, и посреди статьи зияло пустое место.
 */
const GONE = 'Эта запись больше не доступна';

export async function VideoSection({ node, settings, className }: VideoSectionProps) {
  const data = (node.data ?? {}) as unknown as VideoBlockData;

  const mediaId =
    typeof data.video === 'object' && data.video !== null ? data.video.id : (data.video ?? null);
  if (!mediaId) return null;

  const width = data.width === 'wide' ? 'max-w-wide' : 'max-w-content';

  // Куки зрителя пробрасываем в CMS: без них вошедший выглядит анонимом
  // и закрытый видео ему не откроется.
  const cookie = (await headers()).get('cookie') ?? '';

  const [stream, access, playerUi] = await Promise.all([
    getVideoStream(mediaId),
    checkVideoAccess(mediaId, cookie),
    readVideoUi(),
  ]);
  /*
    Записи нет или её нарезку убрали: показываем это словами. Пустое место
    вместо блока читается как поломка страницы, а не как убранная запись.
  */
  if (!stream) {
    return (
      <section className={cn('mx-auto px-4 md:px-6 py-8 md:py-12', width, className)}>
        <VideoNotice text={GONE} />
      </section>
    );
  }

  const poster = data.poster?.url ?? stream.poster?.url;

  /*
    Название и описание - свойства самой записи, а блок только решает,
    показывать их или нет. Набранное в блоке пока перекрывает запись: у сайтов
    в этих полях лежит текст, и терять его при обновлении нельзя (R10).
  */
  const title = data.title?.trim() || (data.showTitle !== false ? stream.title : '');
  const description =
    data.description?.trim() || (data.showDescription ? (stream.description ?? '') : '');

  // Токен нужен только тому, кто действительно будет смотреть: выдавать его
  // при отказе незачем.

  return (
    <section className={cn('mx-auto px-4 md:px-6 py-8 md:py-12', width, className)}>
      {access.allowed && stream.status === 'ready' ? (
        <VideoPlayer
          ui={playerUi}
          deniedSettings={settings.video?.denied}
          src={stream.playlistUrl}
          mediaId={stream.id}
          poster={poster}
          title={title || stream.title}
        />
      ) : (
        <VideoNotice
          poster={poster}
          text={
            stream.status === 'failed'
              ? 'Видео не удалось подготовить к показу'
              : stream.status !== 'ready'
                ? 'Видео готовится к показу'
                : (DENIAL[access.reason ?? 'unavailable'] ?? DENIAL['unavailable']!)
          }
        />
      )}

      {/*
        Подпись стоит под кадром, а не над ним: сперва человек видит саму
        запись, а уже потом читает, что это было.
      */}
      {(title || description) && (
        <footer className="mt-3 flex flex-col gap-1">
          {title && (
            <h2
              data-part="title"
              className="text-h3 font-display font-semibold text-ink text-balance"
            >
              {title}
            </h2>
          )}
          {description && (
            <p data-part="subtitle" className="text-body text-muted whitespace-pre-line">
              {description}
            </p>
          )}
        </footer>
      )}
    </section>
  );
}

/**
 * Заглушка вместо плеера.
 *
 * @remarks
 * С обложкой и текстом, а не чёрным прямоугольником: зритель должен понимать,
 * что видео есть и почему оно не играет, иначе страница выглядит сломанной.
 */
function VideoNotice({ poster, text }: { poster?: string | undefined; text: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      {poster && (
        <img
          data-part="media"
          src={poster}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      )}
      <div
        className={cn(
          'flex items-center justify-center px-6 text-center',
          poster ? 'absolute inset-0 bg-black/60 text-white' : 'aspect-video text-muted',
        )}
      >
        <p data-part="caption" className="text-body font-medium">
          {text}
        </p>
      </div>
    </div>
  );
}
