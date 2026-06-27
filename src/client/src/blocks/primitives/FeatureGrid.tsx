import type { BlockNode, SiteSettings } from 'contracts';

import { BrandIcon } from './StackTransparency';

/**
 * FeatureGrid — сетка карточек с иконкой/заголовком/описанием.
 * Адаптивная: на desktop 4-7 в ряд (wrap), на mobile 2 в ряд.
 */

export interface FeatureGridData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly items?: readonly {
    readonly icon: string;
    readonly title: string;
    readonly subtitle?: string;
    readonly description?: string;
  }[];
}

export function FeatureGrid({
  node,
}: {
  readonly node: BlockNode & { data?: FeatureGridData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading;
  const subtitle = data.subtitle;
  const items = data.items ?? [];

  if (items.length === 0) return null;

  // 7 items → 2-3-2 шахматка на desktop (6-col grid: row1 = 2×3col centered,
  // row2 = 3×2col, row3 = 2×3col centered). Меньше items — fallback на auto-grid.
  const isSevenCheckerboard = items.length === 7;

  return (
    <section className="py-14 md:py-18">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {heading && (
          <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
            {heading}
          </h2>
        )}
        {subtitle && <p className="text-center text-muted mt-3 max-w-2xl mx-auto">{subtitle}</p>}
        <div
          className={
            isSevenCheckerboard
              ? 'mt-10 md:mt-12 grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : `mt-10 md:mt-12 grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 ${
                  items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                }`
          }
        >
          {items.map((item, i) => {
            // 2-3-2 placement: items 0,1 → col-span-3 (row 1, 2×3 = 6 cells)
            //                  items 2,3,4 → col-span-2 (row 2, 3×2 = 6 cells)
            //                  items 5,6 → col-span-3 (row 3, 2×3 = 6 cells)
            const spanClass = isSevenCheckerboard
              ? i < 2 || i > 4
                ? 'lg:col-span-3'
                : 'lg:col-span-2'
              : '';
            return (
              <div
                key={i}
                className={`rounded-xl border border-border bg-bg p-5 text-center hover:shadow-md transition-shadow ${spanClass}`}
              >
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent-soft p-2">
                  <BrandIcon icon={item.icon} label={item.title} size={28} />
                </div>
                <div className="font-display font-semibold text-ink text-sm md:text-base">
                  {item.title}
                </div>
                {item.subtitle && <div className="text-xs text-muted mt-1">{item.subtitle}</div>}
                {item.description && (
                  <div className="text-xs text-muted/80 mt-2 leading-snug">{item.description}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
