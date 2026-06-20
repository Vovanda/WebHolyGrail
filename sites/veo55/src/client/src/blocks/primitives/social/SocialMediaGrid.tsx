'use client';

import { useState } from 'react';
import type { SocialPostMedia } from '@veo55/contracts';

import { cn } from '@/lib/utils';

import { SocialMediaLightbox } from './SocialMediaLightbox';

/**
 * SocialMediaGrid — единая сетка фото+видео VK-стиля.
 *
 * @remarks
 * Layout 1:1 с legacy `news.html → .veo-post__media.n1..n6`:
 *
 *  - n=1: full-width, без crop, max-height 560px, фон чёрный (`object-contain`)
 *  - n=2: 2 равных колонки (`grid-cols-2`)
 *  - n=3: `2fr 1fr` × 2 ряда, p0 занимает обе строки слева (big + 2 справа)
 *  - n=4: 2x2
 *  - n=5: `2fr 1fr 1fr` × 2 ряда, p0 занимает обе строки слева
 *  - n=6: 3x2
 *  - n=7+: те же 6 слотов, **последний** с overlay `+N` (legacy `.veo-post__more`)
 *
 * Gap 2px, фон между фото — `#F3EFE7` (тёплый-кремовый, чтобы шов был мягче чёрного).
 * Видео-элементы — затемнённый превью + play-кружок поверх + длительность m:ss.
 *
 * Client component — потому что нужен click → Lightbox для каждой ячейки.
 * Без `'use client'` нельзя повесить onClick, а ссылки на embed-страницы VK
 * мы хотим перехватить чтобы открыть свой lightbox с каруселью.
 */
export function SocialMediaGrid({ media }: { readonly media: readonly SocialPostMedia[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (media.length === 0) return null;

  const slotCount = media.length >= 7 ? 6 : media.length;
  const shown = media.slice(0, slotCount);
  const extra = media.length - slotCount;

  return (
    <>
      <div
        className={cn(
          'grid gap-[2px] bg-[#F3EFE7]',
          slotCount === 1 && 'bg-black',
          gridClass(slotCount),
        )}
      >
        {shown.map((item, i) => {
          const isLast = i === shown.length - 1 && extra > 0;
          const isFirstBig = i === 0 && (slotCount === 3 || slotCount === 5);
          return (
            <MediaCell
              key={i}
              item={item}
              single={slotCount === 1}
              isFirstBig={isFirstBig}
              overlayPlus={isLast ? extra : 0}
              onClick={() => setLightboxIndex(i)}
            />
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <SocialMediaLightbox
          items={media}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function gridClass(n: number): string {
  // grid-rows-* нужны для n=3 и n=5 — где p0 растягивается на 2 строки.
  switch (n) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-[2fr_1fr] grid-rows-2';
    case 4:
      return 'grid-cols-2 grid-rows-2';
    case 5:
      return 'grid-cols-[2fr_1fr_1fr] grid-rows-2';
    case 6:
      return 'grid-cols-3 grid-rows-2';
    default:
      return 'grid-cols-3 grid-rows-2';
  }
}

function MediaCell({
  item,
  single,
  isFirstBig,
  overlayPlus,
  onClick,
}: {
  readonly item: SocialPostMedia;
  readonly single: boolean;
  readonly isFirstBig: boolean;
  readonly overlayPlus: number;
  readonly onClick: () => void;
}) {
  const isVideo = item.type === 'video';
  // n=1: натуральный аспект, без crop, ограничен 560px по высоте.
  // n>=2: квадратный crop (aspect-square) с object-cover.
  const aspectClass = single ? 'flex items-center justify-center' : 'aspect-square overflow-hidden';
  const spanClass = isFirstBig ? 'row-span-2' : '';
  const imgClass = single
    ? 'w-auto h-auto max-w-full max-h-[560px] object-contain block'
    : 'w-full h-full object-cover block';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative block leading-none overflow-hidden cursor-zoom-in p-0 m-0 border-0 bg-transparent',
        aspectClass,
        spanClass,
      )}
      aria-label={isVideo ? `Открыть видео${item.title ? ` «${item.title}»` : ''}` : 'Открыть фото'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={isVideo ? (item.title ?? 'Видео') : 'Фото к посту'}
        loading="lazy"
        className={cn(imgClass, 'bg-[#F3EFE7]', isVideo && 'opacity-[0.88]')}
      />

      {isVideo && (
        <>
          <span
            aria-hidden
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'flex items-center justify-center rounded-full bg-black/70',
              'border-2 border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
              single ? 'w-[72px] h-[72px]' : 'w-[60px] h-[60px]',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'block w-0 h-0',
                single
                  ? 'ml-[6px] border-l-[22px] border-t-[14px] border-b-[14px]'
                  : 'ml-[5px] border-l-[18px] border-t-[11px] border-b-[11px]',
                'border-l-white border-t-transparent border-b-transparent',
              )}
            />
          </span>
          {item.duration ? (
            <span className="absolute right-2 bottom-2 px-2 py-px rounded bg-black/75 text-white text-xs font-semibold font-sans leading-snug">
              {formatDuration(item.duration)}
            </span>
          ) : null}
        </>
      )}

      {overlayPlus > 0 && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display text-white font-extrabold text-2xl bg-black/55"
        >
          +{overlayPlus}
        </span>
      )}
    </button>
  );
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
