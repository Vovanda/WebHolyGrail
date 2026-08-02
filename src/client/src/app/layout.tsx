import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

import { getSiteSettings } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/media';
import { ThemeBootstrap } from '@/lib/theme-bootstrap';
import { PaletteOverride } from '@/lib/palette-override';
import { YandexMetrika } from '@/lib/analytics';
import { SiteLayout } from '@/layouts/site-layout';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import '@/styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'];
  const logo = resolveMediaUrl(settings.logo) ?? '/branding/logo.png';

  return {
    // Без базы относительные пути в og:image уезжают в ссылку как есть, а
    // мессенджеры и соцсети требуют абсолютный адрес — картинка не покажется.
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: { default: settings.siteName, template: `%s — ${settings.siteName}` },
    icons: {
      icon: '/branding/logo.png',
      shortcut: '/branding/logo.png',
      apple: '/branding/logo.png',
    },
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      locale: 'ru_RU',
      title: settings.siteName,
      images: [{ url: logo, alt: settings.siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.siteName,
      images: [logo],
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  const layoutConfig = settings.layout ?? FALLBACK_SITE_SETTINGS.layout!;
  const themeConfig = settings.theme ?? FALLBACK_SITE_SETTINGS.theme!;

  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <ThemeBootstrap config={themeConfig} />
        <PaletteOverride config={themeConfig} />
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
