import { headers } from 'next/headers';
import type { BlockNode, VideoBlockData } from 'contracts';

import { checkVideoAccess, getVideoStream, issueVideoToken } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { VideoPlayer } from './VideoPlayer';

/**
 * VideoSection — блок с плеером на странице.
 *
 * @remarks
 * Серверная часть (R14): забирает данные ролика, право на просмотр и токен
 * зрителя, а браузеру достаётся только плеер.
 *
 * Право проверяется здесь, до отрисовки. Иначе закрытый ролик показывал бы
 * обычный проигрыватель, а отказ всплывал только по нажатию «play» — зритель
 * читает это как поломку сайта, а не как закрытый доступ.
 */
export interface VideoSectionProps {
  readonly node: BlockNode;
  readonly className?: string;
}

/** Текст отказа. Позже задаётся владельцем в настройках сайта. */
const DENIAL: Record<string, string> = {
  'sign-in-required': 'Видео доступно после входа',
  'not-entitled': 'Видео входит в платный набор',
  unavailable: 'Видео сейчас недоступно',
};

export async function VideoSection({ node, className }: VideoSectionProps) {
  const data = (node.data ?? {}) as unknown as VideoBlockData;

  const mediaId =
    typeof data.video === 'object' && data.video !== null ? data.video.id : (data.video ?? null);
  if (!mediaId) return null;

  // Куки зрителя пробрасываем в CMS: без них вошедший выглядит анонимом
  // и закрытый ролик ему не откроется.
  const cookie = (await headers()).get('cookie') ?? '';

  const [stream, access] = await Promise.all([
    getVideoStream(mediaId),
    checkVideoAccess(mediaId, cookie),
  ]);
  if (!stream) return null;

  const width = data.width === 'wide' ? 'max-w-wide' : 'max-w-content';
  const poster = data.poster?.url ?? stream.poster?.url;

  // Токен нужен только тому, кто действительно будет смотреть: выдавать его
  // при отказе незачем.
  const token = access.allowed && stream.status === 'ready' ? await issueVideoToken() : null;

  return (
    <section className={cn('mx-auto px-4 md:px-6 py-8 md:py-12', width, className)}>
      {(data.title || data.description) && (
        <header className="mb-4 flex flex-col gap-2">
          {data.title && (
            <h2 className="text-h3 font-display font-semibold text-ink text-balance">
              {data.title}
            </h2>
          )}
          {data.description && <p className="text-body text-muted">{data.description}</p>}
        </header>
      )}

      {token && stream.status === 'ready' ? (
        <VideoPlayer
          src={stream.playlistUrl}
          token={token}
          mediaId={stream.id}
          cmsUrl={process.env['NEXT_PUBLIC_CMS_URL'] ?? ''}
          poster={poster}
          title={data.title}
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
        <img src={poster} alt="" aria-hidden="true" className="h-full w-full object-cover" />
      )}
      <div
        className={cn(
          'flex items-center justify-center px-6 text-center',
          poster ? 'absolute inset-0 bg-black/60 text-white' : 'aspect-video text-muted',
        )}
      >
        <p className="text-body font-medium">{text}</p>
      </div>
    </div>
  );
}
