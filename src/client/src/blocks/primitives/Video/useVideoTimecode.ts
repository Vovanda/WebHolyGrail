'use client';

import { useEffect } from 'react';

/**
 * Ссылка с таймкодом: `?t=200` или `?t=3m20s`.
 *
 * @remarks
 * Так пересылают куски записей. Без этого человек отправляет ссылку и словами
 * объясняет, куда мотать.
 *
 * Позиция ставится один раз, когда стала известна длительность: раньше этого
 * момента перемотка молча теряется. Дальше зритель управляет сам, и повторно
 * возвращать его к таймкоду нельзя.
 *
 * Принимаем сам кадр, а не коробку с ним: плеер создаёт кадр не сразу, и
 * проверка «коробка пуста - выходим» отрабатывала раньше его появления. Со
 * значением эффект пересчитывается, когда кадр наконец есть.
 *
 * Обратно: текущее время дописывается в адрес по требованию - этим занимается
 * кнопка «поделиться», ей отдаётся {@link timecodeHref}.
 */
export function useVideoTimecode(media: HTMLVideoElement | null): void {
  useEffect(() => {
    if (!media) return;

    const seconds = parseTimecode(new URLSearchParams(window.location.search).get('t'));
    if (seconds === null) return;

    let done = false;
    const apply = () => {
      if (done || !media.duration) return;
      done = true;
      media.currentTime = Math.min(seconds, media.duration);
    };

    apply();
    media.addEventListener('loadedmetadata', apply);
    media.addEventListener('durationchange', apply);
    return () => {
      media.removeEventListener('loadedmetadata', apply);
      media.removeEventListener('durationchange', apply);
    };
  }, [media]);
}

/**
 * Разбирает таймкод: секундами либо `1h2m3s`.
 *
 * @remarks
 * Оба вида ходят по рукам, поэтому понимаем и то, и другое. Мусор молча
 * пропускаем: ссылка со сломанным таймкодом должна открыть видео с начала, а не
 * поломать страницу.
 */
export function parseTimecode(raw: string | null): number | null {
  if (!raw) return null;

  const plain = Number(raw);
  if (Number.isFinite(plain) && plain >= 0) return Math.floor(plain);

  const parts = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!parts) return null;
  const [, h, m, s] = parts;
  if (!h && !m && !s) return null;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

/** Адрес этого же видео с текущей позицией. */
export function timecodeHref(seconds: number): string {
  const url = new URL(window.location.href);
  url.searchParams.set('t', String(Math.floor(seconds)));
  return url.toString();
}
