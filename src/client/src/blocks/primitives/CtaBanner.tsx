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
    <section
      className="relative py-16 md:py-22 text-accent-fg overflow-hidden"
      style={{
        // Затемнение мягкое: на светлом акценте (золото) текст считается тёмным,
        // и сильный градиент к чёрному сделал бы дальний край нечитаемым.
        background:
          'linear-gradient(135deg, var(--color-accent) 0%, color-mix(in srgb, var(--color-accent) 92%, black) 100%)',
      }}
    >
      <div className="mx-auto max-w-content px-4 md:px-6 text-center">
        {/* Цвет задан на самом заголовке: глобальное правило для h1–h4 красит их
            в --color-ink и перебивает наследование от секции. */}
        <h2 className="font-display text-h2 md:text-h1 font-semibold leading-tight tracking-tight text-accent-fg">
          {heading}
        </h2>
        {subtitle && (
          <p className="mt-4 text-base md:text-lg text-accent-fg/85 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        {(ctaPrimary || ctaSecondary) && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ctaPrimary && (
              <Link
                href={ctaPrimary.href}
                target={ctaPrimary.href.startsWith('http') ? '_blank' : undefined}
                rel={ctaPrimary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent-fg text-accent text-sm font-semibold hover:opacity-90 transition-opacity"
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-accent-fg/40 text-accent-fg text-sm font-medium hover:bg-accent-fg/10 transition-colors"
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
