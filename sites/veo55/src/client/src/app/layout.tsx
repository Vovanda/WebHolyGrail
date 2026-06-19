import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter, Caveat } from 'next/font/google';

import { getSiteSettings } from '@/lib/api-client';
import { ThemeBootstrap } from '@/lib/theme-bootstrap';
import { SiteLayout } from '@/layouts/site-layout';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
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
  display: 'swap',
});

const fontBody = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const fontScript = Caveat({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-script',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  return {
    title: { default: settings.siteName, template: `%s — ${settings.siteName}` },
    description: 'Питомник восточноевропейской овчарки в Омске',
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
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontScript.variable}`}
    >
      <head>
        {/* Synchronous theme bootstrap — runs before first paint, kills FOUC. */}
        <ThemeBootstrap config={themeConfig} />
      </head>
      <body className="min-h-screen font-sans">
        <SiteLayout config={layoutConfig} settings={settings}>
          {children}
        </SiteLayout>
      </body>
    </html>
  );
}
