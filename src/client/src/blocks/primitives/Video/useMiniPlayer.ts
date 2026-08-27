'use client';

import { useEffect, useState } from 'react';

/**
 * Мини-плеер: запись уезжает уголком, когда страницу прокрутили мимо неё.
 *
 * @remarks
 * Иначе просмотр обрывается на полуслове: человек листает к описанию или
 * к списку серии, и картинка уходит вверх вместе со звуком.
 *
 * Уголок появляется только у играющей записи. Поставленную на паузу оставляем
 * на месте: её отложили сознательно, и догонять зрителя окошком незачем.
 *
 * Место уголка - там же, где его ждут по привычке: правый нижний угол, поверх
 * страницы, с возможностью закрыть.
 */
export interface MiniPlayerState {
  /** Показывать ли запись уголком прямо сейчас. */
  readonly active: boolean;
  /** Убрать уголок до следующего раза. */
  readonly dismiss: () => void;
}

export function useMiniPlayer(
  frame: React.RefObject<HTMLElement | null>,
  video: React.RefObject<HTMLVideoElement | null>,
): MiniPlayerState {
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const box = frame.current;
    if (!box) return;

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const media = video.current;
        const playing = media ? !media.paused && !media.ended : false;
        setActive(entry.intersectionRatio < 0.15 && playing);
      },
      // Порог небольшой: уголок должен появляться, когда кадр почти ушёл,
      // а не при первом же движении страницы.
      { threshold: [0, 0.15, 0.5] },
    );

    watcher.observe(box);
    return () => watcher.disconnect();
  }, [frame, video]);

  // Возврат к записи и её пауза снимают отказ: в следующий раз уголок снова
  // уместен.
  useEffect(() => {
    if (active) return;
    setDismissed(false);
  }, [active]);

  return { active: active && !dismissed, dismiss: () => setDismissed(true) };
}
