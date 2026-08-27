import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { VideoSetPlayer } from '@/blocks/primitives/Video/VideoSetPlayer';
import { getPlaylistByCode, issueVideoToken } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/**
 * Страница плейлиста: `/@<канал>/p/<код>`.
 *
 * @remarks
 * Плейлист смотрят, а не изучают, поэтому страница устроена как привычный
 * плейлист: слева играет видео, справа список остальных, и переключение
 * не уводит со страницы.
 *
 * Закрытые видео из списка не убираются — состав плейлиста это его витрина,
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
  if (!playlist) return { title: 'Плейлист не найден' };

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

  /*
    Цвет текста поверх обложки: на тёмной картинке белый, на светлой тёмный.
    Признак считает CMS при загрузке файла - в браузере холст с чужого домена
    не прочитать.

    Пока признака нет (старые файлы), держим прежний вид - светлый текст
    на затемнении.
  */
  const onDarkCover = playlist.coverIsDark !== false;

  return (
    <main className="mx-auto flex max-w-wide flex-col gap-8 px-4 py-8 md:gap-10 md:px-6 md:py-12">
      <Breadcrumbs
        items={[
          { label: playlist.authorName ?? `@${channel}`, href: `/@${channel}` },
          { label: playlist.title },
        ]}
        copyLink
      />

      {/*
        Обложка - фон заголовка, а не картинка над ним: полосой сверху она
        только отодвигала название вниз и ничего не говорила. Название, канал
        со счётом и описание лежат на ней; затемнение снизу держит текст
        читаемым на любом кадре.

        Без обложки остаётся тот же заголовок обычным блоком.
      */}
      <header
        className={cn(
          'flex flex-col justify-start gap-4',
          playlist.cover
            ? 'relative min-h-[22rem] overflow-hidden rounded-xl p-8 pb-24 md:min-h-[28rem] md:p-12 md:pb-28'
            : 'max-w-content',
        )}
      >
        {playlist.cover && (
          <>
            <img
              src={playlist.cover}
              alt=""
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <span
              aria-hidden="true"
              className={
                onDarkCover
                  ? 'absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/40 to-black/10'
                  : 'absolute inset-0 -z-10 bg-gradient-to-b from-white/85 via-white/50 to-white/10'
              }
            />
          </>
        )}

        {/*
          Размер и цвет заданы одной строкой, без слияния классов: слияние
          принимает `text-h1` за цвет и выбрасывает его следующим `text-white`,
          а заголовок молча падает до обычного текста.
        */}
        <h1
          className={
            playlist.cover
              ? onDarkCover
                ? 'text-h1 font-display font-bold leading-tight tracking-tight text-balance text-white drop-shadow-[var(--shadow-text-on-dark)]'
                : 'text-h1 font-display font-bold leading-tight tracking-tight text-balance text-black drop-shadow-[var(--shadow-text-on-light)]'
              : 'text-h2 font-display font-semibold tracking-tight text-balance text-ink'
          }
        >
          {playlist.title}
        </h1>
        <p
          className={
            playlist.cover
              ? onDarkCover
                ? 'text-body font-medium text-white/85 drop-shadow-[var(--shadow-text-on-dark-soft)]'
                : 'text-body font-medium text-black/80 drop-shadow-[var(--shadow-text-on-light-soft)]'
              : 'text-sm text-muted'
          }
        >
          <a
            href={`/@${playlist.channel ?? channel}`}
            className={
              playlist.cover ? 'hover:text-white hover:underline' : 'hover:text-ink hover:underline'
            }
          >
            {playlist.authorName ?? `@${playlist.channel ?? channel}`}
          </a>
          {` · ${playlist.items.length} ${plural(playlist.items.length, 'видео', 'видео', 'видео')}`}
          {openCount < playlist.items.length
            ? ` · ${openCount} ${plural(openCount, 'открытый', 'открытых', 'открытых')}`
            : ''}
        </p>
        {playlist.description && (
          <p
            className={
              playlist.cover
                ? onDarkCover
                  ? 'text-h4 max-w-content font-medium leading-relaxed text-white/90 drop-shadow-[var(--shadow-text-on-dark-soft)]'
                  : 'text-h4 max-w-content font-medium leading-relaxed text-black/85 drop-shadow-[var(--shadow-text-on-light-soft)]'
                : 'text-body max-w-content leading-relaxed text-ink/90'
            }
          >
            {playlist.description}
          </p>
        )}
      </header>

      {token && (
        /*
          Плеер со списком чуть наезжают на низ обложки и кладут на неё тень:
          так видно, что это одна карточка, а не две полосы одна под другой.
          При прокрутке обложка уходит вверх, и нахлёст пропадает сам.
        */
        <div
          className={cn(
            'relative z-10',
            playlist.cover && '-mt-10 rounded-xl shadow-[var(--shadow-overlap-up)] md:-mt-14',
          )}
        >
          {/*
            Вид выбирает зритель: это страница самого плейлиста, а не блок
            на чужой странице, где переключатель включает владелец.
          */}
          <VideoSetPlayer
            items={playlist.items}
            token={token}
            channel={playlist.channel ?? channel}
            setCode={playlist.code ?? code}
            showViewSwitch
          />
        </div>
      )}
    </main>
  );
}

/** «3 видео», «5 видео» — иначе счётчик читается как машинный. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
