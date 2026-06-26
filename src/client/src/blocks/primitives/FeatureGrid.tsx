import type { BlockNode, SiteSettings } from 'contracts';

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
          className={`mt-10 md:mt-12 grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 ${
            items.length >= 7
              ? 'lg:grid-cols-4 xl:grid-cols-7'
              : items.length >= 4
                ? 'lg:grid-cols-4'
                : 'lg:grid-cols-3'
          }`}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-bg p-5 text-center hover:shadow-md transition-shadow"
            >
              <span
                className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent text-xl"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <div className="font-display font-semibold text-ink text-sm md:text-base">
                {item.title}
              </div>
              {item.subtitle && <div className="text-xs text-muted mt-1">{item.subtitle}</div>}
              {item.description && (
                <div className="text-xs text-muted/80 mt-2 leading-snug">{item.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
