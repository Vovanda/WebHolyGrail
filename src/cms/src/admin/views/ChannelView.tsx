'use client';

import { useEffect, useState } from 'react';

/**
 * Канал участника в админке: его записи и подборки одной страницей.
 *
 * @remarks
 * Записи лежат в медиатеке вперемешку с картинками и документами, подборки -
 * в своём списке, а увидеть, что показано на канале, можно было только открыв
 * сам сайт. Здесь всё вместе: что опубликовано, что скрыто, что служебное,
 * и ссылка на живой канал рядом.
 *
 * Данные берутся у той же ручки, что рисует канал на сайте: страница показывает
 * ровно то, что увидит посетитель, а не свою выборку из базы.
 */
interface ChannelVideo {
  readonly code: string;
  readonly title: string;
  readonly poster?: string | null;
  readonly durationSeconds?: number | null;
  readonly ready?: boolean;
  readonly locked?: boolean;
}

interface ChannelSet {
  readonly code?: string | null;
  readonly title: string;
  readonly cover?: string | null;
  readonly count?: number | null;
}

interface Channel {
  readonly channel: string;
  readonly authorName?: string | null;
  readonly videos: readonly ChannelVideo[];
  readonly sets: readonly ChannelSet[];
}

const rowStyle: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: 12,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
};

function Duration({ seconds }: { readonly seconds: number | null | undefined }) {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return <span style={{ opacity: 0.7 }}>{`${minutes}:${String(rest).padStart(2, '0')}`}</span>;
}

export function ChannelView() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let dropped = false;

    async function load() {
      try {
        const me = await fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json());
        const address = me?.user?.channel;
        if (!address) {
          if (!dropped) setFailure('У вашей учётной записи ещё нет адреса канала.');
          return;
        }
        const answer = await fetch(`/api/video/channel/${encodeURIComponent(address)}`);
        if (!answer.ok) {
          if (!dropped) setFailure('Канал пока пуст: ни одной опубликованной записи.');
          return;
        }
        const data = (await answer.json()) as Channel;
        if (!dropped) setChannel(data);
      } catch {
        if (!dropped) setFailure('Не удалось прочитать канал.');
      }
    }

    void load();
    return () => {
      dropped = true;
    };
  }, []);

  return (
    <div style={{ padding: 'var(--base)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>Канал</h1>
        <p style={{ opacity: 0.7, marginTop: 4 }}>
          То же, что видит посетитель: записи и подборки, показанные на канале.
        </p>
      </div>

      {failure && <p>{failure}</p>}

      {channel && (
        <>
          <p style={{ margin: 0 }}>
            <a href={`/@${channel.channel}`} target="_blank" rel="noreferrer">
              Открыть канал на сайте: /@{channel.channel}
            </a>
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Записи ({channel.videos.length})</h2>
            {channel.videos.length === 0 && (
              <p style={{ opacity: 0.7 }}>
                Пока пусто. Запись появляется здесь, когда у неё стоит «Опубликовано».
              </p>
            )}
            {channel.videos.map((video) => (
              <div key={video.code} style={rowStyle}>
                {video.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.poster}
                    alt=""
                    width={96}
                    height={54}
                    style={{ objectFit: 'cover', borderRadius: 3 }}
                  />
                )}
                <span style={{ flex: 1 }}>{video.title}</span>
                <Duration seconds={video.durationSeconds} />
                {video.locked && <span style={{ opacity: 0.7 }}>по коду</span>}
                {!video.ready && <span style={{ opacity: 0.7 }}>режется</span>}
                <a href={`/@${channel.channel}/v/${video.code}`} target="_blank" rel="noreferrer">
                  Открыть
                </a>
              </div>
            ))}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Подборки ({channel.sets.length})</h2>
            {channel.sets.length === 0 && <p style={{ opacity: 0.7 }}>Подборок пока нет.</p>}
            {channel.sets.map((set) => (
              <div key={set.code ?? set.title} style={rowStyle}>
                <span style={{ flex: 1 }}>{set.title}</span>
                {set.count ? <span style={{ opacity: 0.7 }}>{set.count} видео</span> : null}
                {set.code && (
                  <a href={`/@${channel.channel}/p/${set.code}`} target="_blank" rel="noreferrer">
                    Открыть
                  </a>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
