'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BlockNode, SiteSettings, MediaRef } from 'contracts';

import { resolveMediaUrl } from '@/lib/media';

/**
 * BuiltWith — карточки реальных production-сайтов на стеке. Embla-carousel
 * с autoplay (4 сек) — создаёт динамику на desktop, на mobile единственный
 * способ показать все cards без громоздкого вертикального скрола.
 */

export interface BuiltWithData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly items?: readonly {
    readonly siteName: string;
    readonly url: string;
    readonly niche?: string;
    readonly screenshot?: MediaRef | null;
  }[];
}

function mediaUrl(m: MediaRef | null | undefined): string | null {
  return resolveMediaUrl(m);
}

export function BuiltWith({
  node,
}: {
  readonly node: BlockNode & { data?: BuiltWithData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading;
  const subtitle = data.subtitle;
  const items = data.items ?? [];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, [
    AutoScroll({ speed: 0.8, stopOnInteraction: false, stopOnMouseEnter: true }),
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
    <section className="py-14 md:py-18 bg-page-bg">
      <div className="mx-auto max-w-wide px-4 sm:px-6">
        {heading && (
          <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
            {heading}
          </h2>
        )}
        {subtitle && <p className="text-center text-muted mt-3">{subtitle}</p>}

        <div className="relative mt-10">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 md:gap-5">
              {items.map((item, i) => {
                const preview = mediaUrl(item.screenshot);
                return (
                  <div
                    key={i}
                    className="flex-[0_0_85%] sm:flex-[0_0_calc(50%-0.625rem)] lg:flex-[0_0_calc(33.333%-0.834rem)] xl:flex-[0_0_calc(25%-0.94rem)] min-w-0"
                  >
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-xl border border-border bg-bg overflow-hidden shadow-sm hover:shadow-md hover:border-accent/40 transition-all h-full"
                    >
                      <div className="aspect-[16/10] bg-surface relative overflow-hidden">
                        {preview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={preview}
                            alt={item.siteName}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <PreviewPlaceholder siteName={item.siteName} />
                        )}
                      </div>
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-display font-semibold text-ink text-base truncate">
                            {item.siteName}
                          </div>
                          {item.niche && (
                            <div className="text-xs text-muted mt-0.5 truncate">{item.niche}</div>
                          )}
                        </div>
                        <ArrowUpRight
                          size={16}
                          className="text-muted group-hover:text-accent transition-colors shrink-0 mt-1"
                        />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrows */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Предыдущий"
            className="inline-flex absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-bg border border-border text-muted hover:text-ink hover:shadow-md transition-all z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Следующий"
            className="inline-flex absolute right-0 top-1/2 translate-x-3 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-bg border border-border text-muted hover:text-ink hover:shadow-md transition-all z-10"
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
                aria-label={`Слайд ${i + 1}`}
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
 * SVG-плейсхолдер для превью сайта когда нет реального скриншота.
 */
function PreviewPlaceholder({ siteName }: { readonly siteName: string }) {
  const hash = [...siteName].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const offset = (hash % 60) - 30;
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${hash}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-soft)" />
          <stop offset="100%" stopColor="var(--color-surface)" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#grad-${hash})`} />
      <rect x="20" y="20" width="60" height="8" rx="2" fill="var(--color-accent)" opacity="0.6" />
      <rect x="20" y="36" width="120" height="6" rx="2" fill="var(--color-ink)" opacity="0.3" />
      <rect x="20" y="48" width="90" height="6" rx="2" fill="var(--color-ink)" opacity="0.2" />
      <circle cx={160 + offset} cy="120" r="40" fill="var(--color-accent)" opacity="0.25" />
      <circle cx={200 + offset} cy="140" r="30" fill="var(--color-accent)" opacity="0.4" />
      <rect x="20" y="170" width="80" height="6" rx="2" fill="var(--color-ink)" opacity="0.15" />
    </svg>
  );
}
