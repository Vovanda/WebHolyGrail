import { Check, X } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

/**
 * ComparisonTable — две колонки red ✗ vs green ✓ с большим «VS» по центру.
 * Дополнительный антипаттерн категории (0/7 OSS-tools делают inline), у нас
 * сознательно — anti-WordPress positioning. 3-4 пункта в колонке оптимально.
 */

export interface ComparisonTableData {
  readonly heading?: string;
  readonly leftLabel?: string;
  readonly rightLabel?: string;
  readonly leftItems?: readonly { readonly text: string }[];
  readonly rightItems?: readonly { readonly text: string }[];
}

export function ComparisonTable({
  node,
}: {
  readonly node: BlockNode & { data?: ComparisonTableData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading;
  const leftLabel = data.leftLabel ?? 'Обычный путь';
  const rightLabel = data.rightLabel ?? 'С Web Holy Grail';
  const leftItems = data.leftItems ?? [];
  const rightItems = data.rightItems ?? [];

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {heading && (
          <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink mb-10 md:mb-12">
            {heading}
          </h2>
        )}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
          {/* LEFT — red tint */}
          <div className="rounded-xl bg-danger-soft border border-danger/20 p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold text-danger mb-4">{leftLabel}</h3>
            <ul className="space-y-3">
              {leftItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-ink/85">
                  <X size={18} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* VS — centered, only on desktop */}
          <div className="hidden md:flex items-center justify-center text-muted font-display text-2xl font-light">
            VS
          </div>

          {/* RIGHT — green tint */}
          <div className="rounded-xl bg-success-soft border border-success/20 p-6 md:p-8">
            <h3 className="font-display text-lg font-semibold text-success mb-4">{rightLabel}</h3>
            <ul className="space-y-3">
              {rightItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-ink/85">
                  <Check size={18} className="text-success shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-snug">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
