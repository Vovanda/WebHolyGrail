import Link from 'next/link';
import type { BlockNode, SiteSettings } from 'contracts';

/**
 * StackTransparency — лёгкая открытка стека: ряд иконок технологий.
 * Заменяет trust-bar (логотипы клиентов) когда клиентов ещё нет.
 */

export interface StackTransparencyData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly items?: readonly {
    readonly icon: string;
    readonly label: string;
    readonly href?: string;
  }[];
}

export function StackTransparency({
  node,
}: {
  readonly node: BlockNode & { data?: StackTransparencyData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading;
  const subtitle = data.subtitle;
  const items = data.items ?? [];

  if (items.length === 0) return null;

  return (
    <section className="py-10 md:py-14 border-y border-border bg-surface/30">
      <div className="mx-auto max-w-wide px-4 md:px-6 text-center">
        {heading && (
          <h2 className="font-display text-xl md:text-2xl font-semibold text-ink">{heading}</h2>
        )}
        {subtitle && <p className="mt-2 text-sm md:text-base text-muted">{subtitle}</p>}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {items.map((item, i) => (
            <li key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
              <span
                className="grid h-10 w-10 place-items-center text-2xl text-ink/80"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {item.href ? (
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted hover:text-ink transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm text-muted">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
