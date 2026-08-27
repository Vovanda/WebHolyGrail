import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';

import { PATHNAME_HEADER } from '@/lib/pathname-header';
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
  // Логотип — контент: его загружают в настройках сайта, а не кладут файлом в
  // сборку. Пока его нет, иконкой служит нейтральная марка из `public`, а
  // og:image не заполняется вовсе: ссылка на несуществующий файл даёт битую
  // картинку в мессенджере, что хуже, чем превью без картинки.
  const logo = resolveMediaUrl(settings.logo);
  const icon = logo ?? '/favicon.svg';

  return {
    // Без базы относительные пути в og:image уезжают в ссылку как есть, а
    // мессенджеры и соцсети требуют абсолютный адрес — картинка не покажется.
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: { default: settings.siteName, template: `%s — ${settings.siteName}` },
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      locale: 'ru_RU',
      title: settings.siteName,
      ...(logo ? { images: [{ url: logo, alt: settings.siteName }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.siteName,
      ...(logo ? { images: [logo] } : {}),
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = (await getSiteSettings().catch(() => null)) ?? FALLBACK_SITE_SETTINGS;
  // Адрес кладёт middleware: серверной раскладке его больше взять негде,
  // а панели вроде плейлиста нужны не на каждой странице.
  const pathname = (await headers()).get(PATHNAME_HEADER);
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
        <SiteLayout config={layoutConfig} settings={settings} pathname={pathname}>
          {children}
        </SiteLayout>
        {process.env.NEXT_PUBLIC_YM_ID && <YandexMetrika id={process.env.NEXT_PUBLIC_YM_ID} />}
      </body>
    </html>
  );
}
