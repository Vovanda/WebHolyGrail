import { getSiteSettings, listArticles } from '@/lib/api-client';

/**
 * /blog/rss.xml — RSS 2.0 лента последних статей.
 *
 * @remarks
 * Ghost/Substack отдают ленту из коробки, и при переезде на WHG подписчики не
 * должны потеряться — поэтому фид входит в базу движка, а не в конкретный сайт.
 * Абсолютные ссылки строятся от `NEXT_PUBLIC_SITE_URL`.
 */
export const dynamic = 'force-dynamic';

const FEED_LIMIT = 50;

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const [settings, { docs }] = await Promise.all([
    getSiteSettings(),
    listArticles({ limit: FEED_LIMIT, sort: 'newest' }),
  ]);

  const siteName = settings?.siteName ?? 'Блог';
  const items = docs
    .map((article) => {
      const link = `${siteUrl}/blog/${article.slug}`;
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date(article.createdAt).toUTCString();
      const description = article.lead ?? article.subtitle ?? '';
      return [
        '    <item>',
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        description ? `      <description>${escapeXml(description)}</description>` : '',
        ...(article.tags ?? []).map((tag) => `      <category>${escapeXml(tag.label)}</category>`),
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(siteName)}</title>`,
    `    <link>${escapeXml(`${siteUrl}/blog`)}</link>`,
    `    <description>${escapeXml(`Последние материалы — ${siteName}`)}</description>`,
    '    <language>ru</language>',
    `    <atom:link href="${escapeXml(`${siteUrl}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
