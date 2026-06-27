import type { MetadataRoute } from 'next';

/**
 * `/robots.txt` — правила crawling для поисковиков.
 *
 * Стратегия (R15 SEO):
 *  - Публичные страницы открыты для всех
 *  - `/admin`, `/api`, `/_payload`, `/_next`, `/internal` — закрыты (служебное)
 *  - Sitemap указан явно — Google/Yandex подхватят URL'ы по списку, не только через discovery
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/_payload', '/_next', '/internal', '/admin-resources'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
