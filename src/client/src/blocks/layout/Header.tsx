import Link from 'next/link';
import { Github } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

import { ThemeToggle } from './ThemeToggle';
import { BrandMark } from '@/blocks/primitives/BrandMark';

/**
 * Header — шапка сайта: знак, меню и кнопки.
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
  const sticky = settings.header?.sticky ?? false;
  const githubUrl = data.githubUrl;
  const cta = data.primaryCta;

  return (
    /*
      Шапка настоящая - по ширине средней секции: в ней знак, меню и кнопки.
      Влево и вправо от неё идёт её же продолжение - та же полоса с той же
      чертой понизу, только пустая. Глазами это одна шапка во всю ширину окна.

      Продолжения лежат ниже боковой панели: она приезжает и закрывает их
      собой. Сама шапка выше панели - её не перекрыть.

      По умолчанию шапка уезжает вместе со страницей, а наверху остаётся одна
      кнопка меню. Владелец включает липкость галочкой в настройках сайта,
      когда меню должно быть под рукой всё время.
    */
    <header className={sticky ? 'sticky top-0 flex' : 'flex'}>
      <span aria-hidden="true" className="header-side flex-1 border-b border-border" />

      <div className="header-center mx-auto flex w-full max-w-wide items-center gap-3 border-b border-border py-3 pl-4 pr-16 md:gap-4 md:pl-6 md:pr-20">
        {/* Wordmark — inline SVG mark + siteName */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group"
          aria-label={settings.siteName ?? 'На главную'}
        >
          <BrandMark
            logo={settings.logo}
            siteName={settings.siteName ?? 'Сайт'}
            size={36}
            className="group-hover:opacity-90 transition-opacity"
          />
          <span className="font-display text-base md:text-lg font-semibold tracking-tight text-ink whitespace-nowrap">
            {settings.siteName ?? 'Сайт'}
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
              className="icon-button"
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
              className="hidden md:inline-flex items-center px-4 py-2 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
            >
              {cta.label}
            </Link>
          )}
        </div>
      </div>

      <span aria-hidden="true" className="header-side flex-1 border-b border-border" />
    </header>
  );
}
