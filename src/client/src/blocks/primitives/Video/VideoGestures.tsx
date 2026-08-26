'use client';

import { useRef, useState } from 'react';

/**
 * Жесты по кадру: тап играет и ставит на паузу, двойной по краю перематывает.
 *
 * @remarks
 * Так устроены все плееры, к которым привык зритель, и спорить с этой привычкой
 * нечем: кнопки перемотки на телефоне мелкие, а попадать в них приходится на
 * ходу и одной рукой.
 *
 * Одиночный тап отрабатывает с задержкой в четверть секунды — ровно столько
 * ждём второго. Без задержки двойной тап успевал бы поставить на паузу до
 * перемотки, и видео замирало на каждом перемотанном отрезке.
 *
 * Середина кадра оставлена только под паузу: перематывать оттуда неудобно
 * обеими руками, а промах по краю стоил бы случайного прыжка по времени.
 */
export interface VideoGesturesProps {
  /** Кадр, которым управляем. */
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  /** На сколько прыгать двойным тапом. */
  readonly seekSeconds?: number;
}

/** Сколько ждать второго тапа. Больше — заметная задержка паузы, меньше — двойной не ловится. */
const DOUBLE_TAP_MS = 250;

export function VideoGestures({ videoRef, seekSeconds = 10 }: VideoGesturesProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hint, setHint] = useState<'back' | 'forward' | null>(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  const seek = (direction: -1 | 1) => {
    const video = videoRef.current;
    if (!video) return;
    const next = video.currentTime + direction * seekSeconds;
    video.currentTime = Math.min(Math.max(next, 0), video.duration || next);

    // Короткая подсказка: без неё непонятно, сработал жест или промахнулся.
    setHint(direction < 0 ? 'back' : 'forward');
    setTimeout(() => setHint(null), 450);
  };

  const handle = (zone: 'left' | 'center' | 'right') => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      if (zone === 'left') seek(-1);
      else if (zone === 'right') seek(1);
      else togglePlay();
      return;
    }

    timer.current = setTimeout(() => {
      timer.current = null;
      togglePlay();
    }, DOUBLE_TAP_MS);
  };

  return (
    <div className="video-gestures" slot="gestures-chrome">
      <button type="button" aria-label="Назад" onClick={handle('left')} />
      <button type="button" aria-label="Пауза" onClick={handle('center')} />
      <button type="button" aria-label="Вперёд" onClick={handle('right')} />

      {hint && (
        <span className={`video-gesture-hint video-gesture-hint--${hint}`} aria-hidden="true">
          {hint === 'back' ? `−${seekSeconds}` : `+${seekSeconds}`}
        </span>
      )}
    </div>
  );
}
