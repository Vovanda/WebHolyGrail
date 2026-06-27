'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BlockNode, SiteSettings } from 'contracts';

import { SocialIcon } from '@/blocks/primitives/SocialIcon';

/**
 * NavDrawer — боковая drawer-панель с навигацией.
 *
 * Sticky-бургер всегда виден. Overlay с blur+fade. Drawer плавно выезжает с
 * translateX. Cодержимое: nav-пункты (разделённые тонкой линией) + footer-блок
 * с контактами (телефон/email/часы) и SVG-иконками соцсетей. Источник правды —
 * `settings` из CMS (R0).
 */
export interface NavDrawerData {
  /** На какой стороне закреплён drawer. По умолчанию right (правша, см. memory). */
  readonly side?: 'left' | 'right';
  /** Ширина drawer в px. По умолчанию 280. */
  readonly width?: number;
}

export function NavDrawer({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: NavDrawerData };
  readonly settings: SiteSettings;
}) {
  const side = node.data?.side ?? 'right';
  const width = node.data?.width ?? 280;
  const nav = settings.mainNav ?? [];
  const phone = settings.contacts?.phone;
  const email = settings.contacts?.email;
  const hours = settings.contacts?.hours;
  const social = settings.social ?? [];

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const isLeft = side === 'left';

  return (
    // Бургер видим на всех viewport. На desktop drawer дополняет header-nav
    // (соцсети, контакты, дополнительные ссылки).
    <div>
      <button
        type="button"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          // top-2.5 (10px) — центр Header'а (py-3 + h-9 кнопка ≈ 60px).
          // Размер 36×36 (h-9 w-9) совпадает с ThemeToggle/GitHub-icon в Header
          // — единый ритм icon-кнопок.
          //
          // bg-page-bg/90 + backdrop-blur — непрозрачная подложка, иначе
          // burger сливается с любым контентом под ним.
          'fixed top-2.5 z-50',
          isLeft
            ? 'left-[max(16px,calc((100vw-1300px)/2+24px))]'
            : 'right-[max(16px,calc((100vw-1300px)/2+24px))]',
          'inline-flex h-9 w-9 items-center justify-center rounded-md',
          'bg-page-bg/90 backdrop-blur-md border border-border',
          'text-muted hover:text-ink hover:bg-surface-hover transition-colors',
        ].join(' ')}
      >
        {open ? <IconX /> : <IconBurger />}
      </button>

      <div
        role="presentation"
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={[
          'fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm',
          'transition-opacity duration-300 ease-out',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      <aside
        aria-label="Главная навигация"
        aria-hidden={!open}
        className={[
          // open=false → 'hidden' (display:none) для гарантированного скрытия.
          // translate-x-full сам по себе не всегда работает в SSR + некоторых
          // Tailwind JIT edge-cases (особенно с custom width через style).
          'fixed top-0 bottom-0 z-50 flex-col text-ink',
          'shadow-2xl transition-transform duration-300 ease-out',
          isLeft ? 'left-0 border-r border-border' : 'right-0 border-l border-border',
          open ? 'flex translate-x-0' : 'hidden',
        ].join(' ')}
        style={{ width, background: 'var(--color-page-bg)' }}
      >
        {/* Header drawer — той же высоты что Header сайта (py-3 + h-11/12).
            Лого по центру и кликабельно → главная. */}
        {/* Drawer header — высота и отступы как у sticky-Header сайта
            (py-3 + h-9 monogram = 60px, pl-4 md:pl-6) для visual continuity. */}
        <div className="flex items-center gap-2 py-3 pl-4 md:pl-6 pr-4 border-b border-border">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-label={settings.siteName ?? 'На главную'}
            className="flex items-center gap-3 shrink-0"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              className="text-accent"
              aria-hidden="true"
            >
              <rect width="36" height="36" rx="8" fill="currentColor" />
              <text
                x="18"
                y="24"
                textAnchor="middle"
                fontFamily="var(--font-display, system-ui)"
                fontSize="13"
                fontWeight="700"
                fill="white"
                letterSpacing="0.5"
              >
                WHG
              </text>
            </svg>
            <span className="font-display font-semibold text-ink text-base">
              {settings.siteName ?? 'Web Holy Grail'}
            </span>
          </Link>
        </div>

        {/* Nav-пункты — full-width разделители, выраженный hover */}
        <nav className="overflow-y-auto">
          <ul>
            {nav.map((item) => (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <Link
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}
                  className="
                    group relative flex items-center px-6 py-4
                    font-display text-lg text-ink
                    hover:bg-accent/10 hover:text-accent
                    transition-colors
                  "
                >
                  <span
                    aria-hidden
                    className="
                      absolute left-0 top-0 bottom-0 w-1 bg-accent
                      opacity-0 group-hover:opacity-100 transition-opacity
                    "
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Контакты + соцсети — сразу под меню, не прижатые ко дну */}
        {(phone || email || hours || social.length > 0) && (
          <div className="px-6 py-5 space-y-3">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                className="block font-display text-accent text-lg font-semibold hover:text-accent-hover transition-colors"
              >
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="block text-sm text-ink/85 hover:text-accent transition-colors"
              >
                {email}
              </a>
            )}
            {hours && <p className="text-sm text-muted">{hours}</p>}
            {social.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                {social.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label ?? s.platform}
                    className="grid place-items-center h-9 w-9 rounded-full border border-border text-muted hover:text-accent hover:border-accent transition-colors"
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function IconBurger() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}
