import type { MetadataRoute } from 'next';

import { getSiteSettings } from '@/lib/api-client';

/**
 * `/sitemap.xml` — generic автогенерируемый sitemap.
 *
 * Стратегия:
 *  1. Static + nav-driven URLs из `siteSettings.mainNav` — редактор меняет
 *     меню в админке, sitemap подхватывает.
 *  2. `/` гарантированно входит.
 *
 * Domain-маршруты (`/dog/<slug>`, `/puppies/<dob>/<letter>`, `/catalog?dog=N`)
 * добавляются в инстансе через свой `sitemap.ts` или через override этого
 * файла. Generic sitemap не знает про Dogs/Litters/RKF.
 *
 * Кеш — `revalidate: 3600` (час).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const now = new Date();

  const settings = await getSiteSettings();
  const navUrls = new Set<string>(['/']);
  if (settings?.mainNav) {
    for (const item of settings.mainNav) {
      if (item.href && !item.external && item.href.startsWith('/')) {
        navUrls.add(item.href);
      }
    }
  }

  return Array.from(navUrls).map((path) => ({
    url: `${baseUrl}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1.0 : 0.8,
  }));
}
