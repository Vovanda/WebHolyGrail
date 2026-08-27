import { headers } from 'next/headers';
import type { BlockNode, VideoSetBlockData, SiteSettings } from 'contracts';

import { getPlaylistById, issueVideoToken } from '@/lib/api-client';
import { readVideoUi } from '@/lib/video-ui';
import { cn } from '@/lib/utils';

import { AccessCodeDialog } from './AccessCodeDialog';
import { VideoSetList } from './VideoSetList';
import { VideoSetPlayer } from './VideoSetPlayer';

/**
 * VideoSetSection — плейлист видео на произвольной странице.
 *
 * @remarks
 * Серверный (R14): замок у каждого видео считается по конкретному зрителю,
 * поэтому список собирается при показе, а не берётся из кеша страницы.
 *
 * Закрытые видео из списка не убираются: состав плейлиста — его витрина, и по
 * названию с обложкой видно, что человек получит. Играть закрытый всё равно
 * не начнёт, ключ выдаётся отдельно и по тем же правилам.
 */
export interface VideoSetSectionProps {
  readonly node: BlockNode;
  /** Настройки сайта: из них берётся заглушка отказа. */
  readonly settings: SiteSettings;
  readonly className?: string;
}

export async function VideoSetSection({ node, settings, className }: VideoSetSectionProps) {
  const data = (node.data ?? {}) as unknown as VideoSetBlockData;

  const playlistId =
    typeof data.playlist === 'object' && data.playlist !== null
      ? data.playlist.id
      : (data.playlist ?? null);
  if (!playlistId) return null;

  // Куки зрителя пробрасываем: без них вошедший выглядит анонимом, и его
  // открытые видео показались бы закрытыми.
  const cookie = (await headers()).get('cookie') ?? '';
  const playlist = await getPlaylistById(playlistId, cookie);
  if (!playlist) return null;

  // Список отдаётся целиком: число в поле блока говорит, сколько карточек
  // видно сразу, а не сколько их всего. Остальные достаются прокруткой,
  // а в ленте - свайпом.
  const items = playlist.items;
  const heading = data.heading?.trim() || playlist.title;
  const subtitle = data.subtitle?.trim() || playlist.description;
  const setUrl =
    playlist.channel && playlist.code ? `/@${playlist.channel}/p/${playlist.code}` : null;

  const withPlayer = data.mode !== 'list';
  // Токен нужен и списку без плеера: в него дописывается плейлист, когда зритель
  // вводит код в окне.
  const [token, playerUi] = await Promise.all([issueVideoToken(), readVideoUi()]);

  return (
    <section
      className={cn('mx-auto flex w-full max-w-wide flex-col gap-5 px-4 md:px-6', className)}
    >
      {data.showCover !== false && playlist.cover && (
        <img
          data-part="media"
          src={playlist.cover}
          alt=""
          className="aspect-[21/6] w-full rounded-xl object-cover"
        />
      )}

      {/*
        Ссылка на весь плейлист стоит в одной строке с названием. Под списком она
        оставалась висеть сама по себе, и было неясно, к чему относится.
      */}
      {(data.showTitle !== false || data.showDescription !== false || setUrl) && (
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            {data.showTitle !== false && (
              <h2
                data-part="title"
                className="text-h3 font-display font-semibold tracking-tight text-ink text-balance"
              >
                {heading}
              </h2>
            )}
            {data.showLink !== false && setUrl && (
              <a
                href={setUrl}
                data-part="action"
                className="shrink-0 text-sm font-medium text-muted hover:text-ink hover:underline"
              >
                {'Страница плейлиста →'}
              </a>
            )}
          </div>
          {data.showDescription !== false && subtitle && (
            <p data-part="subtitle" className="max-w-content text-body leading-relaxed text-ink/90">
              {subtitle}
            </p>
          )}
        </header>
      )}

      {withPlayer && token ? (
        <VideoSetPlayer
          playerUi={playerUi}
          view={data.listView}
          showViewSwitch={data.showViewSwitch === true}
          title={heading}
          deniedSettings={settings.video?.denied}
          items={items}
          token={token}
          channel={playlist.channel}
          setCode={playlist.code}
          visible={data.limit ?? undefined}
        />
      ) : (
        <>
          <VideoSetList
            items={items}
            channel={playlist.channel}
            setCode={playlist.code}
            orientation={data.layout === 'grid' ? 'horizontal' : 'vertical'}
            limit={data.limit ?? undefined}
          />
          {token && <AccessCodeDialog token={token} />}
        </>
      )}
    </section>
  );
}
