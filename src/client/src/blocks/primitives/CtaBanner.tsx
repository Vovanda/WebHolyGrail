import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

/**
 * CtaBanner — финальный CTA-блок перед footer. Solid blue фон, white text.
 * 2 CTA-кнопки: primary (white solid → blue text) + secondary (transparent outline).
 */

export interface CtaBannerData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly ctaPrimary?: { readonly label: string; readonly href: string };
  readonly ctaSecondary?: { readonly label: string; readonly href: string };
}

export function CtaBanner({
  node,
}: {
  readonly node: BlockNode & { data?: CtaBannerData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading ?? 'Готовы начать?';
  const subtitle = data.subtitle;
  const ctaPrimary = data.ctaPrimary;
  const ctaSecondary = data.ctaSecondary;

  return (
    <section className="py-20 md:py-28 bg-accent text-white">
      <div className="mx-auto max-w-content px-4 md:px-6 text-center">
        <h2 className="font-display text-h2 md:text-h1 font-semibold leading-tight tracking-tight">
          {heading}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base md:text-lg text-white/85 max-w-2xl mx-auto">{subtitle}</p>
        )}
        {(ctaPrimary || ctaSecondary) && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ctaPrimary && (
              <Link
                href={ctaPrimary.href}
                target={ctaPrimary.href.startsWith('http') ? '_blank' : undefined}
                rel={ctaPrimary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white text-accent text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                {ctaPrimary.label}
                <ArrowRight size={16} />
              </Link>
            )}
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                target={ctaSecondary.href.startsWith('http') ? '_blank' : undefined}
                rel={ctaSecondary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
