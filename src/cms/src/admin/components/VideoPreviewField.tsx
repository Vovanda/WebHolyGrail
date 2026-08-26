'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Превью видео в карточке медиафайла.
 *
 * @remarks
 * После нарезки исходник удаляется, и штатное превью Payload показывает крестик:
 * файла по прежнему адресу больше нет. Контент-менеджер читает это как «видео
 * пропало» и идёт перезаливать.
 *
 * Поэтому в карточке показываем не файл, а обложку и состояние нарезки. Плеер
 * сюда не тащим: в админке важно убедиться, что ролик готов и кадр верный,
 * а смотреть его целиком идут на сайт.
 */
type Status = 'pending' | 'processing' | 'ready' | 'failed';

const LABEL: Record<Status, string> = {
  pending: 'В очереди на нарезку',
  processing: 'Нарезается',
  ready: 'Готово к показу',
  failed: 'Нарезка не удалась',
};

export function VideoPreviewField() {
  const { id } = useDocumentInfo();
  const [doc, setDoc] = useState<{
    mimeType?: string;
    preview?: { url?: string } | string | number | null;
    hls?: {
      status?: Status;
      qualities?: ReadonlyArray<{ height?: number | null }> | null;
      durationSeconds?: number | null;
      error?: string | null;
    } | null;
  } | null>(null);

  // Опрашиваем, пока идёт нарезка: она занимает минуты, и без этого человек
  // видит «в очереди» до тех пор, пока не перезагрузит страницу руками.
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const response = await fetch(`/api/media/${id}?depth=1`, { credentials: 'include' });
      if (!response.ok) return;
      const next = await response.json();
      setDoc(next);
      const status = next?.hls?.status;
      if (status === 'ready' || status === 'failed') {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
      }
    };

    void load();
    timer.current = setInterval(() => void load(), 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [id]);

  if (!doc || !String(doc.mimeType ?? '').startsWith('video/')) return null;

  const status = (doc.hls?.status ?? 'pending') as Status;
  const poster = typeof doc.preview === 'object' && doc.preview ? doc.preview.url : undefined;
  const qualities = (doc.hls?.qualities ?? []).flatMap((q) => (q?.height ? [`${q.height}p`] : []));
  const duration = doc.hls?.durationSeconds;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#111',
        }}
      >
        {poster ? (
          <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
        <span
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 13,
            color: '#fff',
            background: status === 'failed' ? '#b3261e' : 'rgba(0,0,0,.65)',
          }}
        >
          {LABEL[status]}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
        {status === 'ready'
          ? [
              qualities.length > 0 ? `Качества: ${qualities.join(', ')}` : null,
              duration
                ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
                : null,
              'Исходник удалён — ролик отдаётся нарезкой',
            ]
              .filter(Boolean)
              .join(' · ')
          : status === 'failed'
            ? (doc.hls?.error ?? 'Причина неизвестна')
            : 'Обновится само, перезагружать страницу не нужно'}
      </p>
    </div>
  );
}
