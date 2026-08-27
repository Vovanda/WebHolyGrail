'use client';

import { useEffect, useRef } from 'react';

/**
 * VideoBackdrop — фоновое видео обложки.
 *
 * Единственная причина, по которой это client-компонент (R14): скорость
 * воспроизведения задаётся только из JS — у `<video>` нет атрибута для неё.
 * Замедленный кадр читается как фон, а не как видео, и не спорит с текстом.
 *
 * Автовоспроизведение работает лишь у беззвучного видео — отсюда `muted`
 * вместе с `autoPlay`. `playsInline` не даёт iOS открыть его на весь экран.
 * Если браузер экономит трафик и видео не стартовало, остаётся постер.
 *
 * `preload="metadata"`, а не `auto`: обложка — первый экран, и с `auto` браузер
 * тянет весь файл до отрисовки страницы. На видео в 17 МБ это означало пустой
 * экран на десятки секунд. Метаданных достаточно, дальше видео догружается по
 * ходу воспроизведения.
 */
export function VideoBackdrop({
  src,
  poster,
  rate = 0.8,
}: {
  readonly src: string;
  readonly poster?: string | undefined;
  readonly rate?: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.playbackRate = rate;
  }, [rate]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover object-center [filter:brightness(0.6)_contrast(1.1)]"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      {...(poster ? { poster } : {})}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
