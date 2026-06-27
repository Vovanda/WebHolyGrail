import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { BlockNode, SiteSettings, MediaRef } from 'contracts';

import { resolveMediaUrl } from '@/lib/media';

/**
 * BuiltWith — карточки реальных production-сайтов на стеке.
 * Real credibility вместо fake testimonials.
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

  if (items.length === 0) return null;

  return (
    <section className="py-14 md:py-18 bg-surface/30">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {heading && (
          <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
            {heading}
          </h2>
        )}
        {subtitle && <p className="text-center text-muted mt-3">{subtitle}</p>}
        <div
          className="mt-10 grid gap-5 md:gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {items.map((item, i) => {
            const preview = mediaUrl(item.screenshot);
            return (
              <Link
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-border bg-bg overflow-hidden hover:shadow-md hover:border-accent/40 transition-all"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * SVG-плейсхолдер для превью сайта когда нет реального скриншота.
 * Минималистичная геометрическая композиция, цвета через CSS-переменные.
 * Володя заменит на реальные screenshots через Media-upload.
 */
function PreviewPlaceholder({ siteName }: { readonly siteName: string }) {
  // Deterministic accent-shift based on siteName chars (no JS random — SSR-safe)
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
