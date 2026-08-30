import { notFound } from 'next/navigation';

import { PlaylistCard } from '@/blocks/primitives/Video/PlaylistCard';
import { VideoSetCard } from '@/blocks/primitives/Video/VideoSetCard';
import { getChannel } from '@/lib/api-client';

/**
 * Канал участника: `/@<канал>`.
 *
 * @remarks
 * Не отдельная сущность, а страница автора: заводить «каналы» рядом с уже
 * существующими участниками значило бы держать два профиля на одного человека.
 *
 * Сейчас здесь только видео. Фото и статьи того же автора встанут сюда же,
 * когда дойдут — адрес для этого и выбран общий, а не `/videos/<автор>`.
 */
type Params = { channel: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { channel } = await params;
  const data = await getChannel(channel);
  if (!data) return { title: 'Канал не найден' };
  return {
    title: data.authorName ?? `@${data.channel}`,
    description: `Видео автора @${data.channel}`,
  };
}

export default async function ChannelPage({ params }: { params: Promise<Params> }) {
  const { channel } = await params;
  const data = await getChannel(channel);
  if (!data) notFound();

  return (
    <main className="mx-auto flex max-w-wide flex-col gap-8 px-4 py-8 md:gap-10 md:px-6 md:py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-h2 font-display font-semibold tracking-tight text-ink">
          {data.authorName ?? `@${data.channel}`}
        </h1>
        <p className="text-sm text-muted">@{data.channel}</p>
      </header>

      {/*
        Плейлисты идут перед отдельными записями: человек, попавший на канал, чаще
        ищет курс целиком, а не одну запись из середины.
      */}
      {data.sets.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-h4 font-display font-semibold tracking-tight text-ink">Плейлисты</h2>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {data.sets.map((set) => (
              <PlaylistCard
                key={set.code}
                set={set}
                channel={data.channel}
                description={set.description}
              />
            ))}
          </div>
        </section>
      )}

      {data.videos.length === 0 && data.sets.length === 0 && (
        <p className="text-body text-muted">Пока нет ни одного видео.</p>
      )}

      {data.videos.length > 0 && (
        <section className="flex flex-col gap-4">
          {data.sets.length > 0 && (
            <h2 className="text-h4 font-display font-semibold tracking-tight text-ink">Видео</h2>
          )}

          {/*
            Карточка та же, что в подборке: она уже умеет замок, затемнение
            и подпись о том, почему видео не играет. Номер не передаётся:
            на канале видео ничем не упорядочены.
          */}
          <ul className="grid list-none gap-5 p-0 md:gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {data.videos.map((video) => (
              <VideoSetCard
                key={video.code}
                item={video}
                channel={data.channel}
                orientation="horizontal"
                current={false}
                setCode={null}
                unlocking={false}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
