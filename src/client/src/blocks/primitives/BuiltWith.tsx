'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { CarouselDeck, CarouselItem } from '@/blocks/primitives/Carousel';
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
    readonly screenshotDark?: MediaRef | null;
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

  if (items.length === 0) return null;

  return (
    <section className="block-space bg-page-bg">
      <div className="mx-auto max-w-wide px-4 sm:px-6">
        {heading && (
          <h2
            data-part="title"
            className="text-center font-display text-h3 md:text-h2 font-semibold text-ink"
          >
            {heading}
          </h2>
        )}
        {subtitle && (
          <p data-part="subtitle" className="text-center text-muted mt-3">
            {subtitle}
          </p>
        )}

        <div className="mt-10">
          <CarouselDeck gap="lg" edge="gap" marquee loop label={heading}>
            {items.map((item, i) => {
              const preview = mediaUrl(item.screenshot);
              // Второй снимок для тёмной темы: светлый там выбивается ярким
              // пятном. Нет второго - показываем единственный.
              const previewDark = mediaUrl(item.screenshotDark) ?? preview ?? undefined;
              return (
                <CarouselItem key={i} width="min(20rem, 85vw)">
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-part="card"
                    className="group block h-full overflow-hidden rounded-xl border border-border bg-bg shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
                  >
                    <div className="aspect-[16/10] bg-surface relative overflow-hidden">
                      {preview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            data-part="card-media"
                            src={preview}
                            alt={item.siteName}
                            className="shot-light absolute inset-0 h-full w-full object-cover"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            data-part="card-media"
                            src={previewDark}
                            alt={item.siteName}
                            className="shot-dark absolute inset-0 h-full w-full object-cover"
                          />
                        </>
                      ) : (
                        <PreviewPlaceholder siteName={item.siteName} />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div
                          data-part="card-title"
                          className="truncate font-display text-base font-semibold text-ink"
                        >
                          {item.siteName}
                        </div>
                        {item.niche && (
                          <div
                            data-part="card-subtitle"
                            className="mt-0.5 truncate text-xs text-muted"
                          >
                            {item.niche}
                          </div>
                        )}
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="mt-1 shrink-0 text-muted transition-colors group-hover:text-accent"
                      />
                    </div>
                  </Link>
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
