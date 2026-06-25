import Link from 'next/link';
import type { BlockNode, SiteSettings } from 'contracts';

import { SocialIcon } from '@/blocks/primitives/SocialIcon';

/**
 * Header — sticky-шапка. На десктопе:
 *  [Лого слева, квадрат] — [Главные пункты nav, центр] — [Телефон + соцсети, справа]
 * На мобиле: nav скрыт, всё работает через NavDrawer (бургер sticky right).
 */
export function Header({
  settings,
}: {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
}) {
  const phone = settings.contacts?.phone;
  const social = settings.social ?? [];
  const nav = settings.mainNav ?? [];

  return (
    <header
      className="sticky top-0 z-30 text-ink border-b border-border/60"
      style={{ background: 'var(--color-page-bg)' }}
    >
      {/* pl-6 pr-20 — асимметрия только во flex-контейнере (внутренний контент
          не должен наезжать на абсолютный бургер). Визуальная симметрия лого ↔
          бургер обеспечивается через left-6/right-6 на самой кнопке и pl-6 у
          лого, оба = 24px от своего края. */}
      <div className="mx-auto flex max-w-wide items-center gap-6 pl-6 pr-20 md:pr-24 py-3">
        {/* Logo — слева, квадрат, заметный */}
        <Link
          href="/"
          className="flex items-center shrink-0 transition-transform hover:scale-105"
          aria-label={settings.siteName ?? 'На главную'}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              typeof settings.logo === 'object'
                ? (settings.logo?.url ?? '/branding/logo.png')
                : '/branding/logo.png'
            }
            alt={settings.siteName ?? 'Питомник'}
            className="h-11 w-11 md:h-12 md:w-12 rounded-lg object-cover shadow-sm border border-border"
          />
        </Link>

        {/* Nav — центр, только desktop */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-7 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="font-display text-base text-ink/85 hover:text-accent transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right — phone + social. На мобиле phone уползает в drawer, иконки тоже. */}
        <div className="ml-auto md:ml-0 flex items-center gap-4">
          {phone && (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, '')}`}
              className="hidden sm:inline font-display text-accent text-sm md:text-base font-semibold hover:text-accent-hover transition-colors whitespace-nowrap"
            >
              {phone}
            </a>
          )}
          {social.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              {social.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label ?? s.platform}
                  className="grid place-items-center h-8 w-8 rounded-full text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
