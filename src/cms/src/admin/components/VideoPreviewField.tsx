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
 * сюда не тащим: в админке важно убедиться, что видео готов и кадр верный,
 * а смотреть его целиком идут на сайт.
 */
type Status = 'pending' | 'processing' | 'ready' | 'failed';

/** Вес человеческими словами: рядом с ним всегда стоит вес нарезки от Payload. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  const units = ['КБ', 'МБ', 'ГБ'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

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
    shortCode?: string | null;
    uploadedBy?: { channel?: string | null } | string | number | null;
    preview?: { url?: string } | string | number | null;
    // Вес исходника приходит отдельным полем: под именем стоит вес нарезки,
    // а исходника в хранилище уже нет, и путать их нельзя.
    sourceFilesize?: number | null;
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

  /**
   * Ссылка на страницу видео.
   *
   * @remarks
   * Кадра мало: у двух похожих видео он одинаковый, и перед публикацией
   * человек всё равно не знает, тот ли файл залит. Поэтому даём открыть видео
   * там, где его увидит зритель, — свой закрытый видео автору открывается.
   *
   * Отдельный проигрыватель в админке заводить не стали: он повторял бы то же
   * самое, но со своими ошибками, и показывал бы не то, что видит зритель.
   */
  const author = typeof doc.uploadedBy === 'object' && doc.uploadedBy ? doc.uploadedBy : null;
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? '';
  const watchUrl =
    doc.shortCode && author?.channel ? `${siteUrl}/@${author.channel}/v/${doc.shortCode}` : null;

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

      {status === 'ready' && watchUrl ? (
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, alignSelf: 'flex-start' }}
        >
          Посмотреть на сайте ↗
        </a>
      ) : null}

      <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
        {status === 'ready'
          ? [
              qualities.length > 0 ? `Качества: ${qualities.join(', ')}` : null,
              duration
                ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`
                : null,
              'Исходника нет: в хранилище лежит нарезка HLS',
              typeof doc.sourceFilesize === 'number'
                ? `исходник весил ${formatBytes(doc.sourceFilesize)}`
                : null,
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
