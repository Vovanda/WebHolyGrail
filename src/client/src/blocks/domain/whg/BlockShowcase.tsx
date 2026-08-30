'use client';

import { CarouselDeck, CarouselItem } from '@/blocks/arrangements/Carousel';
import type { BlockNode, SiteSettings, MediaRef } from 'contracts';

import { resolveMediaUrl } from '@/lib/media';

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
    readonly preview?: MediaRef | null;
  }[];
}

function mediaUrl(m: MediaRef | null | undefined): string | null {
  return resolveMediaUrl(m);
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

  if (items.length === 0) return null;

  return (
    <section className="py-14 md:py-18 bg-page-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <h2
          data-part="title"
          className="text-center font-display text-h3 md:text-h2 font-semibold text-ink"
        >
          {heading}
        </h2>
        {subtitle && (
          <p data-part="subtitle" className="text-center text-muted mt-3">
            {subtitle}
          </p>
        )}

        <div className="mt-10">
          <CarouselDeck gap="lg" edge="gap" dots autoplay={4000} loop label={heading}>
            {items.map((item, i) => {
              const preview = mediaUrl(item.preview);
              return (
                <CarouselItem key={i} width="min(15rem, 46vw)">
                  <div
                    data-part="card"
                    className="rounded-xl border border-border bg-bg overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[4/3] bg-surface relative overflow-hidden">
                      {preview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          data-part="card-media"
                          src={preview}
                          alt={item.label}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <BlockPreviewPlaceholder label={item.label} index={i} />
                      )}
                    </div>
                    <div
                      data-part="card-title"
                      className="p-3 text-center font-display font-medium text-ink text-sm"
                    >
                      {item.label}
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselDeck>
        </div>
      </div>
    </section>
  );
}

/**
 * SVG-плейсхолдер preview готового блока — абстрактная геометрия передающая
 * характер блока. Заменяется реальными screenshots через Media-upload в админке.
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
