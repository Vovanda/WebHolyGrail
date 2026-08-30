'use client';

import { useEffect, useState } from 'react';
import type { VideoSetItem } from 'contracts';

/**
 * Что смотреть дальше — карточка поверх кадра, когда видео кончился.
 *
 * @remarks
 * Досмотренный видео оставляет чёрный прямоугольник, и человек уходит просто
 * потому, что дальше ничего не предложено. Поэтому в конце показываем
 * следующий кадром и названием: нажатие открывает его в том же плеере, без
 * перезагрузки страницы.
 *
 * Сам никуда не переходит: предлагает и ждёт. Автопереход уводит с титров и
 * с того, что человек хотел досмотреть, а отсчёт заставляет следить за цифрой
 * вместо кадра - раздражение сильнее пользы.
 *
 * Пропадает, если зритель вернулся к записи перемоткой: значит он не закончил
 * с ней.
 */
export interface VideoUpNextProps {
  readonly item: VideoSetItem;
  /**
   * Кадр, за окончанием которого следим.
   *
   * @remarks
   * Сам элемент, а не ссылка на него: плеер собирается позже первого рендера,
   * и ссылка к этому времени пуста. Перерисовки она не вызывает, поэтому
   * подписка на окончание не навешивалась вовсе - карточка не появлялась
   * никогда.
   */
  readonly video: HTMLVideoElement | null;
  readonly onSelect: (item: VideoSetItem) => void;
}

export function VideoUpNext({ item, video, onSelect }: VideoUpNextProps) {
  const [visible, setVisible] = useState(false);

  /*
    Смена записи гасит карточку сразу. Иначе она доживает до следующей и
    успевает мигнуть поверх её первых кадров - предлагая уже третью по счёту,
    а не ту, что играет.
  */
  useEffect(() => {
    setVisible(false);
  }, [item.code]);

  // Ждём окончания видео. Слушаем сам кадр, а не считаем время: у потока
  // длительность уточняется по ходу, и вычисленный конец не совпадает с настоящим.
  useEffect(() => {
    if (!video) return;

    const onEnded = () => setVisible(true);
    // Перемотка назад означает, что к видео вернулись: карточку убираем.
    const onPlaying = () => setVisible(false);

    video.addEventListener('ended', onEnded);
    video.addEventListener('playing', onPlaying);
    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('playing', onPlaying);
    };
  }, [video]);

  if (!visible) return null;

  return (
    <div
      data-part="root"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-dark-block/70 px-4 text-center"
    >
      <p data-part="caption" className="text-sm text-dark-block-fg/70">
        Дальше в плейлисте
      </p>

      <button
        type="button"
        data-part="card"
        onClick={() => onSelect(item)}
        className="group flex w-full max-w-xs flex-col gap-2 rounded-xl border border-dark-block-fg/20 bg-dark-block p-2 text-left shadow-lg transition-colors hover:border-dark-block-fg/50"
      >
        {item.poster ? (
          <img
            data-part="card-thumb"
            src={item.poster}
            alt=""
            className="aspect-video w-full rounded-lg object-cover"
          />
        ) : (
          <span
            data-part="card-thumb"
            className="aspect-video w-full rounded-lg bg-dark-block-fg/10"
            aria-hidden="true"
          />
        )}
        <span
          data-part="card-title"
          className="text-body font-medium text-dark-block-fg text-balance"
        >
          {item.title}
        </span>
      </button>

      <div data-part="actions" className="flex items-center gap-3">
        <button
          type="button"
          data-part="action"
          onClick={() => onSelect(item)}
          className="rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Смотреть дальше
        </button>
        <button
          type="button"
          data-part="action"
          onClick={() => setVisible(false)}
          className="rounded-lg border border-dark-block-fg/30 px-3 py-2 text-sm text-dark-block-fg transition-colors hover:bg-dark-block-fg/10"
        >
          Остаться
        </button>
      </div>
    </div>
  );
}
