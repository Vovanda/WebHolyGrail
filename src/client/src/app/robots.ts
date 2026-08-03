import type { MetadataRoute } from 'next';

/**
 * `/robots.txt` — правила crawling для поисковиков.
 *
 * Стратегия (R15 SEO):
 *  - Публичные страницы открыты для всех
 *  - `/admin`, `/api`, `/_payload`, `/_next`, `/internal` — закрыты (служебное)
 *  - Sitemap указан явно — Google/Yandex подхватят URL'ы по списку, не только через discovery
 */
/**
 * Рендер в рантайме, а не при сборке.
 *
 * Адрес сайта задаётся окружением контейнера, а на сборке образа его ещё нет:
 * статический `robots.txt` уезжал на прод с адресом-заглушкой и отдавал
 * поисковику ссылку на чужой домен. `sitemap.ts` этого избежал случайно — он
 * ходит за страницами и потому и так динамический.
 */
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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
