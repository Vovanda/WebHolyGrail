import Link from 'next/link';
import { Github } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

import { ThemeToggle } from './ThemeToggle';
import { BrandMark } from '@/blocks/primitives/BrandMark';

/**
 * Header — sticky-шапка template'а под marketing landing.
 *
 * @remarks
 * Композиция (desktop):
 *   [Wordmark (mark + siteName)] — [mainNav центр] — [GitHub · ThemeToggle · CTA]
 *
 * Композиция (mobile):
 *   [Wordmark] — [ThemeToggle · CTA] (nav уходит в NavDrawer если он сконфигурирован
 *   в SiteSettings.layout, бургер живёт в самом NavDrawer-блоке).
 *
 * Опциональные поля из `node.data` (per-block override):
 *   - `githubUrl?: string` — иконка-ссылка на репо (если нет — иконка скрыта).
 *   - `primaryCta?: { label: string; href: string }` — primary CTA-кнопка
 *     справа от ThemeToggle (если нет — кнопки нет).
 *
 * SiteSettings.theme.userToggle контролирует видимость ThemeToggle (по умолчанию true).
 */

export interface HeaderData {
  readonly githubUrl?: string;
  readonly primaryCta?: { readonly label: string; readonly href: string };
}

export function Header({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: HeaderData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const nav = settings.mainNav ?? [];
  const showThemeToggle = settings.theme?.userToggle ?? true;
  const githubUrl = data.githubUrl;
  const cta = data.primaryCta;

  return (
    <header className="sticky top-0 z-30 bg-page-bg/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-wide items-center gap-3 md:gap-4 pl-4 md:pl-6 pr-16 md:pr-20 py-3">
        {/* Wordmark — inline SVG mark + siteName */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group"
          aria-label={settings.siteName ?? 'На главную'}
        >
          <BrandMark
            logo={settings.logo}
            siteName={settings.siteName ?? 'Web Holy Grail'}
            size={36}
            className="group-hover:opacity-90 transition-opacity"
          />
          <span className="font-display text-base md:text-lg font-semibold tracking-tight text-ink whitespace-nowrap">
            {settings.siteName ?? 'Web Holy Grail'}
          </span>
        </Link>

        {/* Nav — center, desktop only */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-7 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="text-muted hover:text-ink transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right — GitHub · ThemeToggle · CTA */}
        <div className="ml-auto lg:ml-0 flex items-center gap-1 md:gap-2">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface-hover transition-colors"
            >
              <Github size={18} />
            </a>
          )}
          {showThemeToggle && <ThemeToggle />}
          {cta && (
            <Link
              href={cta.href}
              target={cta.href.startsWith('http') ? '_blank' : undefined}
              rel={cta.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="hidden md:inline-flex items-center px-4 py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
            >
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
