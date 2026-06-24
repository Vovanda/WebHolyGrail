'use client';

import { useEffect, useRef, useState } from 'react';
import type { SocialPostMedia } from '@veo55/contracts';

import { cn } from '@/lib/utils';

/**
 * SocialMediaLightbox — модалка-карусель для фото+видео из соц-поста.
 *
 * @remarks
 * Поддерживает оба типа: photo (большое фото с натуральным аспектом, центр)
 * и video (VK iframe `video_ext.php?embed`). На VK iframe нельзя ставить
 * `referrerpolicy=no-referrer` — VK видит реферрер для авторизации.
 *
 * Управление:
 *  - Esc → закрыть
 *  - ← / → → prev/next
 *  - клик по фону → закрыть; клик по медиа — НЕ закрывает
 *  - swipe touch (минимальная реализация без зависимостей)
 *
 * Архитектурно — нативный `<dialog>` через `dialog.showModal()` (backdrop
 * + focus-trap бесплатно от браузера). Альтернатива через Radix не нужна —
 * нам не нужны кастомные animation states / portals.
 */
export function SocialMediaLightbox({
  items,
  startIndex,
  onClose,
}: {
  readonly items: readonly SocialPostMedia[];
  readonly startIndex: number;
  readonly onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (!d.open) d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        setIdx((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setIdx((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClose]);

  const current = items[idx];
  if (!current) return null;

  const hasPrev = idx > 0;
  const hasNext = idx < items.length - 1;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Закрытие по клику в backdrop. Контент в этом dialog лежит внутри
        // дочернего <div>, клик по нему останавливается.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        'fixed inset-0 m-0 max-w-none max-h-none w-screen h-screen',
        'bg-transparent backdrop:bg-black/85 backdrop:backdrop-blur-sm',
        'overflow-hidden p-0',
      )}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 50) return;
          if (dx < 0 && hasNext) setIdx(idx + 1);
          else if (dx > 0 && hasPrev) setIdx(idx - 1);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden>
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Счётчик */}
        <span className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-sans backdrop-blur-sm">
          {idx + 1} / {items.length}
        </span>

        {/* Prev/Next */}
        {hasPrev && (
          <button
            type="button"
            onClick={() => setIdx(idx - 1)}
            aria-label="Предыдущее"
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => setIdx(idx + 1)}
            aria-label="Следующее"
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        )}

        {/* Контент */}
        <div className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center">
          {current.type === 'video' && current.embedUrl ? (
            <iframe
              src={current.embedUrl}
              title={current.title ?? 'Видео'}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
              allowFullScreen
              className="w-[92vw] max-w-[1280px] aspect-video bg-black border-0"
            />
          ) : current.type === 'video' ? (
            // Fallback: видео без embedUrl (старые записи синкнутые до того как
            // адаптер начал собирать embedUrl). Показываем превью + CTA на VK.
            <div className="relative w-[92vw] max-w-[1280px] aspect-video bg-black flex items-center justify-center">
              {current.url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={current.url}
                  alt={current.title ?? 'Видео'}
                  className="absolute inset-0 w-full h-full object-contain opacity-60"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <p className="font-display italic text-white/90 text-lg text-center px-4">
                  Видео не вшито в страницу — откройте на VK
                </p>
                {current.pageUrl && (
                  <a
                    href={current.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold text-sm transition-colors hover:bg-accent-hover"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
                      <path d="M21.547 7.165c.171-.5 0-.871-.717-.871h-2.359c-.605 0-.882.32-1.054.667 0 0-1.21 2.946-2.918 4.858-.553.55-.804.726-1.106.726-.151 0-.371-.176-.371-.676V7.165c0-.601-.176-.871-.679-.871H8.62c-.378 0-.604.281-.604.546 0 .57.85.7.937 2.301v3.475c0 .763-.137.901-.439.901-.804 0-2.762-2.96-3.926-6.343-.227-.652-.456-.916-1.063-.916H1.166c-.677 0-.812.32-.812.667 0 .626.804 3.755 3.756 7.901 1.967 2.829 4.738 4.364 7.262 4.364 1.514 0 1.7-.341 1.7-.92v-2.123c0-.678.142-.81.62-.81.353 0 .957.178 2.368 1.535 1.612 1.612 1.878 2.336 2.785 2.336h2.358c.677 0 1.015-.341.819-1.015-.215-.671-.984-1.644-2.004-2.797-.554-.655-1.385-1.36-1.636-1.712-.354-.453-.252-.654 0-1.058.001 0 2.898-4.082 3.198-5.466z" />
                    </svg>
                    Смотреть на VK
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={current.url}
              alt={current.title ?? 'Фото'}
              className="max-w-[92vw] max-h-[88vh] object-contain"
            />
          )}
        </div>

        {/* Подпись для видео */}
        {current.type === 'video' && current.title && (
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[80vw] text-center text-white/90 font-display italic text-base">
            {current.title}
          </p>
        )}
      </div>
    </dialog>
  );
}
