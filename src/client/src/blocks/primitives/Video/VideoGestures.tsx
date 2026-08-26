'use client';

import { useRef, useState } from 'react';

/**
 * Жесты по кадру: показать управление, перемотать двойным тапом, поставить паузу.
 *
 * @remarks
 * Одиночное нажатие показывает и прячет управление, двойное по краю
 * перематывает, пауза ставится кнопкой. Так это работает и пальцем, и мышью:
 * одинаковое поведение запоминается один раз, а разное приходится
 * переучивать при каждой смене устройства.
 *
 * Пауза по одиночному нажатию не годится: экран трогают, чтобы посмотреть,
 * сколько осталось, и видео останавливалось бы каждый раз.
 *
 * Одиночное нажатие отрабатывает с задержкой в четверть секунды: ровно столько
 * ждём второго. Без задержки двойной тап успевал бы сработать как одиночный.
 */
export interface VideoGesturesProps {
  /** Кадр, которым управляем. */
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Контроллер плеера: у него переключается видимость управления. */
  readonly controllerRef: React.RefObject<HTMLElement | null>;
  /** На сколько прыгать двойным тапом. */
  readonly seekSeconds?: number;
}

/** Сколько ждать второго нажатия. Больше — заметная задержка, меньше — двойной не ловится. */
const DOUBLE_TAP_MS = 250;

export function VideoGestures({ videoRef, controllerRef, seekSeconds = 10 }: VideoGesturesProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hint, setHint] = useState<'back' | 'forward' | null>(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };

  /**
   * Показать или спрятать управление.
   *
   * @remarks
   * `media-chrome` прячет его по бездействию, помечая контроллер атрибутом.
   * Снимаем и ставим его же, чтобы не заводить второй источник правды
   * о видимости.
   */
  const toggleControls = () => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (controller.hasAttribute('userinactive')) controller.removeAttribute('userinactive');
    else controller.setAttribute('userinactive', '');
  };

  const seek = (direction: -1 | 1) => {
    const video = videoRef.current;
    if (!video) return;
    const next = video.currentTime + direction * seekSeconds;
    video.currentTime = Math.min(Math.max(next, 0), video.duration || next);

    // Короткая подсказка: без неё непонятно, сработал жест или палец промахнулся.
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
      toggleControls();
    }, DOUBLE_TAP_MS);
  };

  return (
    <div className="video-gestures" slot="gestures-chrome">
      <button type="button" aria-label="Назад" onClick={handle('left')} />
      <button type="button" aria-label="Показать управление" onClick={handle('center')} />
      <button type="button" aria-label="Вперёд" onClick={handle('right')} />

      {hint && (
        <span className={`video-gesture-hint video-gesture-hint--${hint}`} aria-hidden="true">
          {hint === 'back' ? `−${seekSeconds}` : `+${seekSeconds}`}
        </span>
      )}
    </div>
  );
}
