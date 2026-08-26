import { headers } from 'next/headers';
import type { BlockNode, VideoSetBlockData } from 'contracts';

import { getPlaylistById, issueVideoToken } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { VideoSetList } from './VideoSetList';
import { VideoSetPlayer } from './VideoSetPlayer';

/**
 * VideoSetSection — набор роликов на произвольной странице.
 *
 * @remarks
 * Серверный (R14): замок у каждого ролика считается по конкретному зрителю,
 * поэтому список собирается при показе, а не берётся из кеша страницы.
 *
 * Закрытые ролики из списка не убираются: состав набора — его витрина, и по
 * названию с обложкой видно, что человек получит. Играть закрытый всё равно
 * не начнёт, ключ выдаётся отдельно и по тем же правилам.
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

  const withPlayer = data.mode !== 'list';
  // Токен выписывается только там, где есть чему играть: на странице со
  // списком он бесполезен.
  const token = withPlayer ? await issueVideoToken() : null;

  return (
    <section
      className={cn('mx-auto flex w-full max-w-wide flex-col gap-5 px-4 md:px-6', className)}
    >
      {data.showCover !== false && playlist.cover && (
        <img src={playlist.cover} alt="" className="aspect-[21/6] w-full rounded-xl object-cover" />
      )}

      {(data.showTitle !== false || data.showDescription !== false) && (
        <header className="flex flex-col gap-2">
          {data.showTitle !== false && (
            <h2 className="text-h3 font-display font-semibold tracking-tight text-ink text-balance">
              {heading}
            </h2>
          )}
          {data.showDescription !== false && subtitle && (
            <p className="max-w-content text-body leading-relaxed text-ink/90">{subtitle}</p>
          )}
        </header>
      )}

      {withPlayer && token ? (
        <VideoSetPlayer
          items={items}
          token={token}
          channel={playlist.channel}
          setCode={playlist.code}
        />
      ) : (
        <VideoSetList
          items={items}
          channel={playlist.channel}
          setCode={playlist.code}
          orientation={data.layout === 'grid' ? 'horizontal' : 'vertical'}
        />
      )}

      {data.showLink !== false && setUrl && (
        <a
          href={setUrl}
          className="self-start text-sm font-medium text-muted hover:text-ink hover:underline"
        >
          {hidden > 0 ? `Ещё ${hidden} в наборе →` : 'Весь набор →'}
        </a>
      )}
    </section>
  );
}
