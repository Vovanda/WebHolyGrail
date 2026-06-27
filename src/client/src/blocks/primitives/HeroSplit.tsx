import Link from 'next/link';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

import { Icon } from './Icon';
import { renderAccentHeading } from '@/lib/heading-accent';

/**
 * HeroSplit — двух-колоночный hero: текст+CTA слева, vertical-steps card справа.
 *
 * Композиция (desktop):
 *   |  heading (H1)            |  rightTitle (опц.)
 *   |  subtitle                |  step → step → step → step
 *   |  [CTA primary] [CTA sec] |  rightCaption (italic muted)
 *   |  ✓ badge ✓ badge ✓ ...   |
 *
 * Mobile: stack columns (текст сверху, steps card снизу).
 */

export interface HeroSplitData {
  readonly heading?: string;
  readonly headingAccent?: string;
  readonly subtitle?: string;
  readonly ctaPrimary?: { readonly label: string; readonly href: string };
  readonly ctaSecondary?: { readonly label: string; readonly href: string };
  readonly badges?: readonly { readonly label: string }[];
  readonly rightTitle?: string;
  readonly rightSteps?: readonly {
    readonly icon?: string;
    readonly label: string;
    readonly sub?: string;
  }[];
  readonly rightCaption?: string;
}

export function HeroSplit({
  node,
}: {
  readonly node: BlockNode & { data?: HeroSplitData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading ?? 'Начните с landing-сайта. Вырастите во что угодно.';
  const headingAccent = data.headingAccent;
  const subtitle = data.subtitle ?? '';
  const ctaPrimary = data.ctaPrimary;
  const ctaSecondary = data.ctaSecondary;
  const badges = data.badges ?? [];
  const rightTitle = data.rightTitle;
  const rightSteps = data.rightSteps ?? [];
  const rightCaption = data.rightCaption;

  return (
    <section className="relative bg-page-bg py-14 md:py-20 overflow-hidden">
      {/* Атмосферный градиент hero — radial accent справа сверху + dot-grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(70% 90% at 95% 0%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 55%), radial-gradient(50% 70% at 10% 100%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(var(--color-ink) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-wide px-4 sm:px-6 grid lg:grid-cols-[55fr_45fr] gap-8 sm:gap-10 lg:gap-12 items-center">
        {/* LEFT — text + CTA + badges */}
        <div>
          <h1
            className="font-display font-semibold leading-tight tracking-tight text-ink"
            style={{ fontSize: 'clamp(2rem, 5vw, var(--text-h1))' }}
          >
            {renderAccentHeading(heading, headingAccent)}
          </h1>
          {subtitle && (
            <p className="mt-5 text-base md:text-lg text-muted leading-relaxed max-w-[560px]">
              {subtitle}
            </p>
          )}
          {(ctaPrimary || ctaSecondary) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {ctaPrimary && (
                <CtaButton href={ctaPrimary.href} variant="primary">
                  {ctaPrimary.label}
                  <ArrowRight size={16} />
                </CtaButton>
              )}
              {ctaSecondary && (
                <CtaButton href={ctaSecondary.href} variant="secondary">
                  {ctaSecondary.label}
                </CtaButton>
              )}
            </div>
          )}
          {badges.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {badges.map((b, i) => (
                <li key={i} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-success" />
                  {b.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT — vertical-steps card */}
        {rightSteps.length > 0 && (
          <div className="rounded-2xl bg-bg border border-border shadow-lg p-6 md:p-7 backdrop-blur-sm">
            {rightTitle && (
              <h2 className="font-display text-h4 font-semibold text-ink mb-4">{rightTitle}</h2>
            )}
            <ol className="space-y-1">
              {rightSteps.map((step, i) => (
                <li key={i}>
                  <div className="flex items-start gap-3 py-2">
                    <Icon
                      icon={step.icon ?? '◆'}
                      label={step.label}
                      size={40}
                      background="accent-soft"
                      rounded="md"
                      innerScale={0.6}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink text-base leading-tight">
                        {step.label}
                      </div>
                      {step.sub && <div className="text-sm text-muted mt-0.5">{step.sub}</div>}
                    </div>
                  </div>
                  {i < rightSteps.length - 1 && (
                    <div
                      className="flex h-10 w-10 items-center justify-center text-muted"
                      aria-hidden="true"
                    >
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {rightCaption && (
              <p className="mt-5 text-center text-sm italic text-muted">{rightCaption}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function CtaButton({
  href,
  variant,
  children,
}: {
  readonly href: string;
  readonly variant: 'primary' | 'secondary';
  readonly children: React.ReactNode;
}) {
  const external = href.startsWith('http');
  const base =
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap';
  const styles =
    variant === 'primary'
      ? 'bg-accent text-white hover:bg-accent-hover shadow-sm'
      : 'border border-border bg-bg text-ink hover:bg-surface';
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`${base} ${styles}`}
    >
      {children}
    </Link>
  );
}
