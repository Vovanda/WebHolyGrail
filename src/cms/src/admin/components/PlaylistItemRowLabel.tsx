'use client';

import { useRowLabel } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

/**
 * Заголовок строки ролика в наборе.
 *
 * @remarks
 * Штатный заголовок показывает «Ролик 01» и имя файла, поэтому два похожих
 * ролика в наборе различить нельзя, не открыв каждый. При сборке подборки это
 * делается на каждой строке.
 *
 * Здесь вместо этого кадр, название и длительность — по ним ролик опознаётся
 * сразу. Плеера нет намеренно: смотреть идут в карточку ролика, а набор нужен,
 * чтобы проверить состав и порядок. Проигрыватель в каждой строке означал бы
 * столько же загруженных потоков, сколько роликов в наборе.
 *
 * Данные подтягиваются отдельным запросом: форма отдаёт только идентификатор
 * выбранного файла, а название и обложка живут в самом документе.
 */
type Video = {
  caption?: string;
  filename?: string;
  preview?: { url?: string } | string | number | null;
  hls?: { durationSeconds?: number | null; status?: string } | null;
};

export function PlaylistItemRowLabel() {
  const { data, rowNumber } = useRowLabel<{ video?: Video | string | number | null }>();
  const [loaded, setLoaded] = useState<Video | null>(null);

  const raw = data?.video ?? null;
  const id = typeof raw === 'object' && raw ? null : raw;

  useEffect(() => {
    if (id === null || id === undefined || id === '') return;
    let cancelled = false;
    void fetch(`/api/media/${id}?depth=1`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: Video | null) => {
        if (!cancelled) setLoaded(doc);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const video = (typeof raw === 'object' && raw ? raw : loaded) ?? null;
  const order = String((rowNumber ?? 0) + 1).padStart(2, '0');

  if (!video) return <span>Ролик {order}</span>;

  const poster = typeof video.preview === 'object' && video.preview ? video.preview.url : undefined;
  const title = video.caption?.trim() || video.filename || 'Ролик';
  const duration = video.hls?.durationSeconds;
  const notReady = video.hls?.status && video.hls.status !== 'ready';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {poster ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          style={{ width: 48, height: 27, objectFit: 'cover', borderRadius: 3, display: 'block' }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 48,
            height: 27,
            borderRadius: 3,
            background: 'var(--theme-elevation-100)',
            display: 'block',
          }}
        />
      )}
      <span>
        {order}. {title}
      </span>
      {typeof duration === 'number' && duration > 0 ? (
        <span style={{ opacity: 0.6 }}>{formatDuration(duration)}</span>
      ) : null}
      {notReady ? <span style={{ opacity: 0.6 }}>· готовится</span> : null}
    </span>
  );
}

/** «12:05» — привычный вид длительности. */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
