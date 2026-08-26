'use client';

import { useEffect, useState } from 'react';
import type { VideoSetItem } from 'contracts';

/**
 * Что смотреть дальше — карточка поверх кадра, когда ролик кончился.
 *
 * @remarks
 * Досмотренный ролик оставляет чёрный прямоугольник, и человек уходит просто
 * потому, что дальше ничего не предложено. Поэтому в конце показываем
 * следующий кадром и названием: нажатие открывает его в том же плеере, без
 * перезагрузки страницы.
 *
 * Переход происходит и сам, по отсчёту, но с кнопкой «остаться». Без неё
 * автопереход уводит с титров и с того, что человек хотел досмотреть, —
 * раздражение сильнее пользы.
 *
 * Отсчёт останавливается, если зритель перемотал назад: значит он вернулся
 * к ролику, а не закончил с ним.
 */
export interface VideoUpNextProps {
  readonly item: VideoSetItem;
  /** Кадр, за окончанием которого следим. */
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly onSelect: (item: VideoSetItem) => void;
  /** Сколько секунд до автоперехода. */
  readonly delaySeconds?: number;
}

export function VideoUpNext({ item, videoRef, onSelect, delaySeconds = 8 }: VideoUpNextProps) {
  const [visible, setVisible] = useState(false);
  const [left, setLeft] = useState(delaySeconds);

  // Ждём окончания ролика. Слушаем сам кадр, а не считаем время: у потока
  // длительность уточняется по ходу, и вычисленный конец не совпадает с настоящим.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnded = () => {
      setLeft(delaySeconds);
      setVisible(true);
    };
    // Перемотка назад означает, что к ролику вернулись: карточку убираем.
    const onPlaying = () => setVisible(false);

    video.addEventListener('ended', onEnded);
    video.addEventListener('playing', onPlaying);
    return () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('playing', onPlaying);
    };
  }, [videoRef, delaySeconds]);

  useEffect(() => {
    if (!visible) return;
    if (left <= 0) {
      onSelect(item);
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, left, item, onSelect]);

  if (!visible) return null;

  return (
    <div className="video-upnext">
      <p className="video-upnext__label">Дальше в наборе</p>

      <button type="button" onClick={() => onSelect(item)} className="video-upnext__card">
        {item.poster ? (
          <img src={item.poster} alt="" className="video-upnext__poster" />
        ) : (
          <span className="video-upnext__poster" aria-hidden="true" />
        )}
        <span className="video-upnext__title">{item.title}</span>
      </button>

      <div className="video-upnext__actions">
        <span className="video-upnext__countdown">Через {left}…</span>
        <button type="button" onClick={() => setVisible(false)} className="video-upnext__cancel">
          Остаться
        </button>
      </div>
    </div>
  );
}
