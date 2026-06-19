import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { getSiteSettings } from '@/lib/api-client';
import '@/styles/globals.css';

/**
 * Корневой layout. Контент-вселенная сайта живёт в SiteSettings (header, контакты),
 * читаемом серверным компонентом — раз в 5 минут с revalidate-тегом.
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
    <html lang="ru">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
