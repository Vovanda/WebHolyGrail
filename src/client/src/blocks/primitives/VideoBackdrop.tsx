'use client';

import { useEffect, useRef } from 'react';

import { pickStart } from './Video/backdrop-start';
import { isStream } from './Video/stream-source';

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
 * Источник бывает двух видов, и вид определяет поведение.
 *
 * Нарезка приходит кусками: первый кадр появляется, когда загружено несколько
 * секунд, а не весь файл. Она же позволяет начинать с произвольного места,
 * потому что нужный кусок берётся отдельно от остальных, — и каждый круг
 * обложка показывает другую часть съёмки вместо узнаваемой петли.
 *
 * Отдельный файл остаётся как был: `preload="metadata"`, чтобы обложка не
 * тянула его целиком до первой отрисовки (на видео в 17 МБ это давало пустой
 * экран на десятки секунд), и штатный повтор браузера. Сайты, у которых в
 * обложке стоит прямая ссылка, ведут себя ровно как прежде (R10).
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
  const stream = isStream(src);

  useEffect(() => {
    const el = ref.current;
    if (el) el.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) return;

    let detach: (() => void) | null = null;
    let dropped = false;

    void import('./Video/backdrop-stream')
      .then(({ attachStream }) => attachStream(el, src))
      .then((stop) => {
        if (dropped) {
          stop();
          return;
        }
        detach = stop;

        /*
          Запуск повторяется здесь: `autoPlay` срабатывает на пустом кадре -
          источника у него тогда ещё нет, потому что нарезку подключает
          библиотека, - и второй раз браузер сам не пробует. Скорость задаётся
          тут же: подключение потока сбрасывает её к обычной.
        */
        el.playbackRate = rate;
        void el.play().catch(() => {
          // Браузер вправе отказать - тогда остаётся постер, и это не поломка.
        });
      })
      .catch(() => {
        // Не собрали поток — остаётся постер. Обложка не то место, где стоит
        // объяснять зрителю сетевую неудачу.
      });

    return () => {
      dropped = true;
      detach?.();
    };
  }, [src, stream, rate]);

  /*
    Своё начало и свой круг: повтор браузера всегда возвращает в ту же точку,
    поэтому запись прокручивается сама, а `loop` у нарезки выключен.
  */
  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) return;

    const jump = () => {
      el.currentTime = pickStart(el.duration);
    };
    const again = () => {
      jump();
      void el.play().catch(() => {
        // Браузер вправе отказать в продолжении — тогда останется последний кадр.
      });
    };

    // Метаданные могли прийти до подписки — тогда события уже не будет.
    if (Number.isFinite(el.duration) && el.duration > 0) jump();
    el.addEventListener('loadedmetadata', jump);
    el.addEventListener('ended', again);

    return () => {
      el.removeEventListener('loadedmetadata', jump);
      el.removeEventListener('ended', again);
    };
  }, [src, stream]);

  return (
    <video
      ref={ref}
      data-part="backdrop"
      className="absolute inset-0 h-full w-full object-cover object-center [filter:brightness(0.6)_contrast(1.1)]"
      autoPlay
      muted
      loop={!stream}
      playsInline
      preload="metadata"
      {...(poster ? { poster } : {})}
      aria-hidden="true"
      tabIndex={-1}
    >
      {!stream && <source src={src} type="video/mp4" />}
    </video>
  );
}
