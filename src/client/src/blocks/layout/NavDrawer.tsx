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
    <>
      <button
        type="button"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          // top-3 (12px) — центр хедера (py-3 + h-11 ≈ 68px). body без
          // padding-top → header.top=0. Размер/rounded совпадают с лого.
          //
          // Горизонталь: позиционируем относительно контентной полосы
          // `max-w-wide=1300px`, не viewport. На узких экранах ≤1300px = 24px
          // (как лого с pl-6); на широких — 24px от **края контентного блока**,
          // зеркально логотипу. Идиома `max(24px, calc((100vw-1300px)/2+24px))`.
          'fixed top-3 z-50',
          isLeft
            ? 'left-[max(24px,calc((100vw-1300px)/2+24px))]'
            : 'right-[max(24px,calc((100vw-1300px)/2+24px))]',
          'grid place-items-center h-11 w-11 md:h-12 md:w-12 rounded-lg',
          'bg-surface text-ink shadow-sm border border-border',
          // hover-фон #d1c69f — тёплый бежевый, мягче accent-янтарного,
          // лучше читается с тёмной иконкой. Применяется ко всем icon-кнопкам
          // (бургер, X лайтбокса, X drawer-модалки).
          'hover:bg-[#d1c69f] hover:border-[#d1c69f] transition-colors',
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
          'fixed top-0 bottom-0 z-50 flex flex-col text-ink',
          'shadow-2xl transition-transform duration-300 ease-out',
          isLeft ? 'left-0 border-r border-border' : 'right-0 border-l border-border',
          open ? 'translate-x-0' : isLeft ? '-translate-x-full' : 'translate-x-full',
        ].join(' ')}
        style={{ width, background: 'var(--color-page-bg)' }}
      >
        {/* Header drawer — той же высоты что Header сайта (py-3 + h-11/12).
            Лого по центру и кликабельно → главная. */}
        <div className="flex items-center justify-center py-3 border-b border-border">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-label={settings.siteName ?? 'На главную'}
            className="shrink-0 transition-transform hover:scale-105"
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
    </>
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
