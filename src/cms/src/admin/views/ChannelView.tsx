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
interface Запись {
  readonly code: string;
  readonly title: string;
  readonly poster?: string | null;
  readonly durationSeconds?: number | null;
  readonly ready?: boolean;
  readonly locked?: boolean;
}

interface Подборка {
  readonly code?: string | null;
  readonly title: string;
  readonly cover?: string | null;
  readonly count?: number | null;
}

interface Канал {
  readonly channel: string;
  readonly authorName?: string | null;
  readonly videos: readonly Запись[];
  readonly sets: readonly Подборка[];
}

const рамка: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: 12,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
};

function Длительность({ секунды }: { readonly секунды: number | null | undefined }) {
  if (!секунды || секунды <= 0) return null;
  const м = Math.floor(секунды / 60);
  const с = Math.round(секунды % 60);
  return <span style={{ opacity: 0.7 }}>{`${м}:${String(с).padStart(2, '0')}`}</span>;
}

export function ChannelView() {
  const [канал, setКанал] = useState<Канал | null>(null);
  const [ошибка, setОшибка] = useState<string | null>(null);

  useEffect(() => {
    let брошено = false;

    async function загрузить() {
      try {
        const я = await fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json());
        const адрес = я?.user?.channel;
        if (!адрес) {
          if (!брошено) setОшибка('У вашей учётной записи ещё нет адреса канала.');
          return;
        }
        const ответ = await fetch(`/api/video/channel/${encodeURIComponent(адрес)}`);
        if (!ответ.ok) {
          if (!брошено) setОшибка('Канал пока пуст: ни одной опубликованной записи.');
          return;
        }
        const данные = (await ответ.json()) as Канал;
        if (!брошено) setКанал(данные);
      } catch {
        if (!брошено) setОшибка('Не удалось прочитать канал.');
      }
    }

    void загрузить();
    return () => {
      брошено = true;
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

      {ошибка && <p>{ошибка}</p>}

      {канал && (
        <>
          <p style={{ margin: 0 }}>
            <a href={`/@${канал.channel}`} target="_blank" rel="noreferrer">
              Открыть канал на сайте: /@{канал.channel}
            </a>
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Записи ({канал.videos.length})</h2>
            {канал.videos.length === 0 && (
              <p style={{ opacity: 0.7 }}>
                Пока пусто. Запись появляется здесь, когда у неё стоит «Опубликовано».
              </p>
            )}
            {канал.videos.map((видео) => (
              <div key={видео.code} style={рамка}>
                {видео.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={видео.poster}
                    alt=""
                    width={96}
                    height={54}
                    style={{ objectFit: 'cover', borderRadius: 3 }}
                  />
                )}
                <span style={{ flex: 1 }}>{видео.title}</span>
                <Длительность секунды={видео.durationSeconds} />
                {видео.locked && <span style={{ opacity: 0.7 }}>по коду</span>}
                {!видео.ready && <span style={{ opacity: 0.7 }}>режется</span>}
                <a href={`/@${канал.channel}/v/${видео.code}`} target="_blank" rel="noreferrer">
                  Открыть
                </a>
              </div>
            ))}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Подборки ({канал.sets.length})</h2>
            {канал.sets.length === 0 && <p style={{ opacity: 0.7 }}>Подборок пока нет.</p>}
            {канал.sets.map((подборка) => (
              <div key={подборка.code ?? подборка.title} style={рамка}>
                <span style={{ flex: 1 }}>{подборка.title}</span>
                {подборка.count ? (
                  <span style={{ opacity: 0.7 }}>{подборка.count} видео</span>
                ) : null}
                {подборка.code && (
                  <a
                    href={`/@${канал.channel}/p/${подборка.code}`}
                    target="_blank"
                    rel="noreferrer"
                  >
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
