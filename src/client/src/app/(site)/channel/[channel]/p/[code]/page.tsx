import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { VideoSetPlayer } from '@/blocks/primitives/Video/VideoSetPlayer';
import { getPlaylistByCode, issueVideoToken } from '@/lib/api-client';

/**
 * Страница набора: `/@<канал>/p/<код>`.
 *
 * @remarks
 * Набор смотрят, а не изучают, поэтому страница устроена как привычный
 * плейлист: слева играет ролик, справа список остальных, и переключение
 * не уводит со страницы.
 *
 * Закрытые ролики из списка не убираются — состав набора это его витрина,
 * и по названию с обложкой видно, за что платят. Играть закрытый не начнёт:
 * ключ выдаётся отдельно и по тем же правилам.
 *
 * Рендерится на сервере (R14): замок зависит от прав конкретного зрителя,
 * и собранная в браузере страница показала бы всем одно и то же.
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

  const token = await issueVideoToken();
  const openCount = playlist.items.filter((item) => !item.locked).length;

  return (
    <main className="mx-auto flex max-w-wide flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      {playlist.cover && (
        <img src={playlist.cover} alt="" className="aspect-[21/6] w-full rounded-xl object-cover" />
      )}

      <header className="flex max-w-content flex-col gap-2">
        <h1 className="text-h2 font-display font-semibold tracking-tight text-ink text-balance">
          {playlist.title}
        </h1>
        <p className="text-sm text-muted">
          <a href={`/@${playlist.channel ?? channel}`} className="hover:text-ink hover:underline">
            {playlist.authorName ?? `@${playlist.channel ?? channel}`}
          </a>
          {` · ${playlist.items.length} ${plural(playlist.items.length, 'видео', 'видео', 'видео')}`}
          {openCount < playlist.items.length
            ? ` · ${openCount} ${plural(openCount, 'открытый', 'открытых', 'открытых')}`
            : ''}
        </p>
        {playlist.description && (
          <p className="text-body leading-relaxed text-ink/90">{playlist.description}</p>
        )}
      </header>

      {token && (
        <VideoSetPlayer
          items={playlist.items}
          token={token}
          title={playlist.title}
          channel={playlist.channel ?? channel}
          setCode={playlist.code ?? code}
        />
      )}
    </main>
  );
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
