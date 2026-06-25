import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter, Caveat, Noto_Color_Emoji } from 'next/font/google';

import { getSiteSettings } from '@/lib/api-client';
import { ThemeBootstrap } from '@/lib/theme-bootstrap';
import { YandexMetrika } from '@/lib/analytics';
import { SiteLayout } from '@/layouts/site-layout';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import '@/styles/globals.css';

/**
 * Шрифты — `next/font` (self-host + автопреload + zero CLS).
 * CSS-переменные цепляются на `<html className>`.
 *
 * Дефолтный набор: Cormorant Garamond (display) + Inter (body) + Caveat
 * (script-акценты). Переопределяется per-site через site.config.ts.
 */
const fontDisplay = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
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
    icons: {
      icon: '/branding/logo.png',
      shortcut: '/branding/logo.png',
      apple: '/branding/logo.png',
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // SiteSettings приходит из CMS (R3 — через `contracts`).
  // Fallback если CMS недоступна или global не заполнен.
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  const layoutConfig = settings.layout ?? FALLBACK_SITE_SETTINGS.layout!;
  const themeConfig = settings.theme ?? FALLBACK_SITE_SETTINGS.theme!;

  return (
    <html
      lang="ru"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontScript.variable} ${fontEmoji.variable}`}
    >
      <head>
        <ThemeBootstrap config={themeConfig} />
      </head>
      <body className="min-h-screen font-sans">
        <SiteLayout config={layoutConfig} settings={settings}>
          {children}
        </SiteLayout>
        {process.env.NEXT_PUBLIC_YM_ID && <YandexMetrika id={process.env.NEXT_PUBLIC_YM_ID} />}
      </body>
    </html>
  );
}
