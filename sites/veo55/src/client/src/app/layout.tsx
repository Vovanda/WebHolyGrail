import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter, Caveat } from 'next/font/google';

import { getSiteSettings } from '@/lib/api-client';
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

/**
 * Корневой layout — title и description приходят из SiteSettings (Payload global),
 * читаемого серверным компонентом с revalidate-тегом. Когда `siteName` меняется
 * в админке — публичный <title> обновляется в течение 5 мин.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings().catch(() => null);
  const siteName = settings?.siteName ?? 'Питомник «Омская Дружина»';
  return {
    title: { default: siteName, template: `%s — ${siteName}` },
    description: 'Питомник восточноевропейской овчарки в Омске',
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontScript.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans">{children}</body>
    </html>
  );
}
