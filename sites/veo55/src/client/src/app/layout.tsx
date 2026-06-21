import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter, Caveat, Noto_Color_Emoji } from 'next/font/google';

import { getSiteSettings } from '@/lib/api-client';
import { ThemeBootstrap } from '@/lib/theme-bootstrap';
import { YandexMetrika } from '@/lib/analytics';
import { SiteLayout } from '@/layouts/site-layout';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import { PawTrail } from '@/components/PawTrail';
import { DogDetailDrawerRoot } from '@/blocks/veo55/dogs/DogDetailDrawer';
import { SocialLikePopupRoot } from '@/blocks/primitives/social/SocialLikePopup';
import '@/styles/globals.css';

/**
 * Шрифты загружаются через next/font (self-host + автопреload + zero CLS).
 * Каждый экспортирует CSS-переменную, которую мы цепляем в <html className>.
 * Имена переменных совпадают с теми что используются в tokens.css → tailwind.
 *
 * Источник выбора шрифтов — `holy-grail/reference/veo55-visual-pasport`:
 * Cormorant Garamond (display) + Inter (body) + Caveat (только подпись Ольги).
 */
const fontDisplay = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  // 'optional': браузер ждёт шрифт в initial render window (~100ms).
  // next/font делает preload → шрифт успевает; swap не происходит → нет FOUT.
  display: 'optional',
});

const fontBody = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'optional',
});

const fontScript = Caveat({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-script',
  display: 'optional',
});

// Noto Color Emoji — единый набор эмодзи на всех платформах
// (Windows/Mac/Linux/Android выглядят одинаково). 1:1 из оригинала veo55.
const fontEmoji = Noto_Color_Emoji({
  subsets: ['emoji'],
  weight: ['400'],
  variable: '--font-emoji',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  return {
    title: { default: settings.siteName, template: `%s — ${settings.siteName}` },
    description: 'Питомник восточноевропейской овчарки в Омске',
    icons: {
      icon: '/branding/logo.png',
      shortcut: '/branding/logo.png',
      apple: '/branding/logo.png',
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // SiteSettings приходит из CMS (R3 — через @veo55/contracts).
  // Если CMS недоступна или global ещё не заполнен — fallback-конфиг, не пустой экран.
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  const layoutConfig = settings.layout ?? FALLBACK_SITE_SETTINGS.layout!;
  const themeConfig = settings.theme ?? FALLBACK_SITE_SETTINGS.theme!;

  return (
    <html
      lang="ru"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontScript.variable} ${fontEmoji.variable}`}
    >
      <head>
        {/* Synchronous theme bootstrap — runs before first paint, kills FOUC. */}
        <ThemeBootstrap config={themeConfig} />
      </head>
      <body className="min-h-screen font-sans">
        <PawTrail />
        <SiteLayout config={layoutConfig} settings={settings}>
          {children}
        </SiteLayout>
        {/* Глобальная модалка-карточка собаки. Перехватывает клики на
            `[data-detail-dialog]` и открывается через hash `#d=dog:<slug>`. */}
        <DogDetailDrawerRoot />
        {/* Глобальный popup ❤️/🐾 в постах и комментах. Перехватывает клики
            на `[data-like-popup="like|repost"]` — пост/коммент маркирует
            кнопку этим атрибутом, root показывает tooltip с CTA в VK. */}
        <SocialLikePopupRoot vkGroupUrl={process.env.VK_GROUP_URL ?? 'https://vk.com/veoomsk'} />
        {process.env.NEXT_PUBLIC_YM_ID && <YandexMetrika id={process.env.NEXT_PUBLIC_YM_ID} />}
      </body>
    </html>
  );
}
