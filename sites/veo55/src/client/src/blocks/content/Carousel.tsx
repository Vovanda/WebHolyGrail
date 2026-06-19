'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carousel — универсальный track-based слайдер с translateX-анимацией.
 *
 * Опции:
 *  - `heightFromFirstSlide=true`: высота контейнера = natural aspect первого слайда
 *    (его hidden копия задаёт height). Остальные слайды — absolute inset:0 с
 *    `object-fit: cover` (кропятся по краям если их aspect-ratio другой).
 *    Используется когда у баннеров разные размеры — все выравниваются под
 *    первый, нет белых полос.
 *  - `aspect` / `height`: фиксированные размеры контейнера (приоритет над heightFromFirstSlide).
 *  - `arrows=true`: SVG chevron-left / chevron-right, центрированные.
 *  - `swipe=true`: pointer-events свайп ≥50px.
 *  - `interval`: автоповорот в ms (пауза при hover/touch).
 */
export interface CarouselSlide {
  readonly url: string;
  readonly alt: string;
}

export interface CarouselProps {
  readonly slides: readonly CarouselSlide[];
  readonly interval?: number;
  readonly arrows?: boolean;
  readonly swipe?: boolean;
  readonly objectFit?: 'cover' | 'contain';
  readonly aspect?: string;
  readonly height?: string;
  readonly heightFromFirstSlide?: boolean;
  readonly background?: string;
  readonly rounded?: string;
}

export function Carousel({
  slides,
  interval,
  arrows = false,
  swipe = true,
  objectFit = 'contain',
  aspect,
  height,
  heightFromFirstSlide = false,
  background = 'transparent',
  rounded,
}: CarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef<{ startX: number; lastDelta: number } | null>(null);

  const total = slides.length;
  const goTo = useCallback((i: number) => setActive(((i % total) + total) % total), [total]);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (!interval || total <= 1 || paused) return;
    const t = setInterval(() => setActive((cur) => (cur + 1) % total), interval);
    return () => clearInterval(t);
  }, [interval, total, paused]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipe || total <= 1) return;
    dragRef.current = { startX: e.clientX, lastDelta: 0 };
    setPaused(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current.lastDelta = e.clientX - dragRef.current.startX;
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    setPaused(false);
    if (!d) return;
    if (Math.abs(d.lastDelta) < 50) return;
    if (d.lastDelta < 0) next();
    else prev();
  };

  if (total === 0) return null;

  const containerStyle: React.CSSProperties = {
    background,
    borderRadius: rounded,
    overflow: 'hidden',
    position: 'relative',
    touchAction: swipe ? 'pan-y' : undefined,
    ...(height ? { height } : aspect ? { aspectRatio: aspect } : null),
  };

  const useFirstAsSpacer = heightFromFirstSlide && !height && !aspect;
  const imgFit = useFirstAsSpacer ? 'cover' : objectFit;

  return (
    <div
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {useFirstAsSpacer && (
        // Hidden spacer = natural aspect первого слайда задаёт высоту контейнера.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slides[0]!.url}
          alt=""
          aria-hidden
          draggable={false}
          className="block w-full select-none"
          style={{ height: 'auto', visibility: 'hidden', pointerEvents: 'none' }}
        />
      )}

      <div
        className={useFirstAsSpacer ? 'absolute inset-0 flex' : 'flex h-full w-full'}
        style={{
          transform: `translateX(-${active * 100}%)`,
          transition: 'transform 1s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {slides.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${s.url}-${i}`}
            src={s.url}
            alt={s.alt}
            draggable={false}
            className="block w-full select-none"
            style={{
              flex: '0 0 100%',
              maxWidth: '100%',
              height: useFirstAsSpacer || height || aspect ? '100%' : 'auto',
              objectFit: imgFit,
            }}
          />
        ))}
      </div>

      {arrows && total > 1 && (
        <>
          <ArrowButton side="prev" onClick={prev} />
          <ArrowButton side="next" onClick={next} />
        </>
      )}
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: 'prev' | 'next'; onClick: () => void }) {
  const isPrev = side === 'prev';
  return (
    <button
      type="button"
      aria-label={isPrev ? 'Предыдущий слайд' : 'Следующий слайд'}
      onClick={onClick}
      className={[
        'absolute top-1/2 -translate-y-1/2 z-10',
        isPrev ? 'left-3' : 'right-3',
        'grid place-items-center h-10 w-10 rounded-full text-bg',
        'transition-colors',
      ].join(' ')}
      style={{ background: 'rgba(43,34,26,.45)' }}
      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(43,34,26,.7)')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(43,34,26,.45)')}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 fill-none stroke-current"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={isPrev ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}
