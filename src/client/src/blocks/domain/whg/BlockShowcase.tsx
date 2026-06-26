import type { BlockNode, SiteSettings, Media } from 'contracts';

/**
 * BlockShowcase (WHG-specific) — карточки готовых блоков template'а.
 * Каждая карточка — preview (real screenshot или SVG-плейсхолдер) + название.
 *
 * Carousel не нужен — 4-6 карточек в сетке умещаются на mobile в 2 columns.
 * (Carousel добавим если придётся показывать 10+ блоков, R9.)
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

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
          {heading}
        </h2>
        {subtitle && <p className="text-center text-muted mt-3">{subtitle}</p>}
        <div className="mt-10 grid gap-4 md:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {items.map((item, i) => {
            const preview = mediaUrl(item.preview);
            return (
              <div
                key={i}
                className="rounded-xl border border-border bg-bg overflow-hidden hover:shadow-md transition-shadow"
              >
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * SVG-плейсхолдер preview готового блока — абстрактная геометрия
 * передающая характер блока (Hero — крупный текст, FAQ — accordion-полосы и т.д.).
 * Володя заменит на реальные screenshots через Media-upload.
 */
function BlockPreviewPlaceholder({
  label,
  index,
}: {
  readonly label: string;
  readonly index: number;
}) {
  // Deterministic color shift по index'у
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
