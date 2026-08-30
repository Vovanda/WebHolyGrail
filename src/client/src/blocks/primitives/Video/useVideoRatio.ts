'use client';

import { useEffect, useState } from 'react';

/**
 * Форма кадра: рамка принимает соотношение сторон самой записи.
 *
 * @remarks
 * Пока метаданных нет, отдаётся `null`, и рамка стоит в 16:9 - иначе страница
 * прыгает, когда кадр наконец приходит. Дальше берётся форма потока:
 * вертикальная запись живёт в чёрных полях, а не растягивается поперёк себя.
 *
 * Размеры известны только из самого потока: в манифесте их нет, а до метаданных
 * браузер о записи ничего не знает. Отсюда обе подписки - `loadedmetadata`
 * на первое появление и `resize` на смену качества.
 *
 * Вид `ширина/высота`: в этой записи соотношение принимают и CSS, и слой
 * на vidstack, а десятичную дробь второй не разбирает.
 */
/** Пока форма записи неизвестна: привычная рамка, чтобы страница не прыгала. */
export const DEFAULT_RATIO = '16/9';

/**
 * Форма по размерам кадра.
 *
 * @remarks
 * Нули приходят и до метаданных, и от записи без картинки: делить на них нельзя,
 * и рамке в таком случае остаётся её умолчание.
 */
export function ratioOf(width: number, height: number): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width <= 0 || height <= 0) return null;
  return `${width}/${height}`;
}

export function useVideoRatio(video: HTMLVideoElement | null): string | null {
  const [ratio, setRatio] = useState<string | null>(null);

  useEffect(() => {
    if (!video) return;

    const apply = () => {
      const found = ratioOf(video.videoWidth, video.videoHeight);
      if (found) setRatio(found);
    };

    // Метаданные могли прийти до подписки - тогда события уже не будет.
    apply();
    video.addEventListener('loadedmetadata', apply);
    video.addEventListener('resize', apply);
    return () => {
      video.removeEventListener('loadedmetadata', apply);
      video.removeEventListener('resize', apply);
    };
  }, [video]);

  return ratio;
}
