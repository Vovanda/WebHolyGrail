'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BlockNode, SiteSettings, Media } from 'contracts';

/**
 * BlockShowcase (WHG-specific) — живая embla-карусель превью блоков template'а.
 *
 * @remarks
 * Использует embla-carousel-react + autoplay (4 сек) — заодно демонстрирует
 * сам Carousel-блок в работе (т.е. одна из карточек "Карусель" — и есть он сам).
 * 'use client' нужен для embla-state.
 */

export interface BlockShowcaseData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly items?: readonly {
    readonly label: string;
    readonly preview?: Media | number | null;
  }[];
}

function mediaUrl(m: Media | number | null | undefined): string | null {
  if (!m || typeof m !== 'object') return null;
  return m.url ?? null;
}

export function BlockShowcase({
  node,
}: {
  readonly node: BlockNode & { data?: BlockShowcaseData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading ?? 'Современный UI из коробки';
  const subtitle = data.subtitle;
  const items = data.items ?? [];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: false }, [
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((idx: number) => emblaApi?.scrollTo(idx), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length);
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (items.length === 0) return null;

  return (
    <section className="py-14 md:py-18 bg-surface/30">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
          {heading}
        </h2>
        {subtitle && <p className="text-center text-muted mt-3">{subtitle}</p>}

        <div className="relative mt-10">
          {/* Embla viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 md:gap-5">
              {items.map((item, i) => {
                const preview = mediaUrl(item.preview);
                return (
                  <div
                    key={i}
                    className="flex-[0_0_calc(50%-0.625rem)] sm:flex-[0_0_calc(33.333%-0.834rem)] lg:flex-[0_0_calc(25%-0.94rem)] min-w-0"
                  >
                    <div className="rounded-xl border border-border bg-bg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-[4/3] bg-surface relative overflow-hidden">
                        {preview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={preview}
                            alt={item.label}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <BlockPreviewPlaceholder label={item.label} index={i} />
                        )}
                      </div>
                      <div className="p-3 text-center font-display font-medium text-ink text-sm">
                        {item.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrows */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Предыдущий блок"
            className="hidden md:inline-flex absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-bg border border-border text-muted hover:text-ink hover:shadow-md transition-all z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Следующий блок"
            className="hidden md:inline-flex absolute right-0 top-1/2 translate-x-3 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-bg border border-border text-muted hover:text-ink hover:shadow-md transition-all z-10"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        {snapCount > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: snapCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Перейти к слайду ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === selectedIndex ? 'w-6 bg-accent' : 'w-2 bg-border hover:bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * SVG-плейсхолдер preview готового блока — абстрактная геометрия передающая
 * характер блока. Володя заменит на реальные screenshots через Media-upload.
 */
function BlockPreviewPlaceholder({
  label,
  index,
}: {
  readonly label: string;
  readonly index: number;
}) {
  const accentShift = (index * 30) % 360;
  return (
    <svg
      viewBox="0 0 200 150"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-label={`Preview блока ${label}`}
    >
      <defs>
        <linearGradient id={`bp-${index}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-soft)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--color-surface)" />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill={`url(#bp-${index})`} />
      <rect
        x="20"
        y="30"
        width={80 + (accentShift % 40)}
        height="14"
        rx="3"
        fill="var(--color-ink)"
        opacity="0.6"
      />
      <rect
        x="20"
        y="52"
        width={120 - (accentShift % 30)}
        height="6"
        rx="2"
        fill="var(--color-ink)"
        opacity="0.25"
      />
      <rect x="20" y="64" width={100} height="6" rx="2" fill="var(--color-ink)" opacity="0.18" />
      <rect x="20" y="92" width="50" height="20" rx="4" fill="var(--color-accent)" opacity="0.7" />
      <rect x="80" y="92" width="50" height="20" rx="4" fill="var(--color-ink)" opacity="0.1" />
    </svg>
  );
}
