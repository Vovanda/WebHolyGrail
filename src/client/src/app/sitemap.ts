import type { MetadataRoute } from 'next';

import {
  getSiteSettings,
  listAllPages,
  listAllTags,
  listAllThreads,
  listArticles,
  listCatalogSections,
  listOffers,
} from '@/lib/api-client';
import { isModuleEnabled } from 'contracts';

/**
 * `/sitemap.xml` — автоматический sitemap по содержимому CMS.
 *
 * Что попадает:
 *  1. Все опубликованные `Pages` (страница в sitemap'е даже если её нет в меню).
 *  2. Пункты `siteSettings.mainNav` — ловит маршруты, у которых нет записи в
 *     Pages (например `/blog`, отданный отдельным роутом).
 *  3. Блог: `/blog`, все статьи, страницы тегов и серий — если коллекции пусты,
 *     ничего не добавляется и sitemap остаётся страничным.
 *
 * Domain-маршруты инстанса (`/dog/<slug>`, `/catalog`) добавляются override'ом
 * этого файла в самом инстансе.
 *
 * Кеш — `revalidate: 3600` (час).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();

  const [settings, pages, articles, tags, threads] = await Promise.all([
    getSiteSettings().catch(() => null),
    listAllPages().catch(() => []),
    listArticles({ limit: 500, sort: 'newest' })
      .then((result) => result.docs)
      .catch(() => []),
    listAllTags().catch(() => []),
    listAllThreads().catch(() => []),
  ]);

  /** url → entry, последняя запись побеждает. Дедуп: страница может быть и в Pages, и в меню. */
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  const add = (
    path: string,
    options: { lastModified?: Date; priority?: number; changeFrequency?: ChangeFrequency } = {},
  ) => {
    const normalized = path === '/' || path === '/home' ? '' : path;
    const url = `${baseUrl}${normalized}`;
    entries.set(url, {
      url,
      lastModified: options.lastModified ?? now,
      changeFrequency: options.changeFrequency ?? 'weekly',
      priority: options.priority ?? 0.8,
    });
  };

  add('/', { priority: 1.0 });

  for (const page of pages) {
    if (!page.slug) continue;
    add(`/${page.slug}`, {
      lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
    });
  }

  for (const item of settings?.mainNav ?? []) {
    if (item.href && !item.external && item.href.startsWith('/')) add(item.href);
  }

  if (articles.length > 0) {
    add('/blog', { changeFrequency: 'daily', priority: 0.9 });
    for (const article of articles) {
      add(`/blog/${article.slug}`, {
        lastModified: new Date(article.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    for (const tag of tags) {
      add(`/blog/tag/${tag.slug}`, { changeFrequency: 'weekly', priority: 0.5 });
    }
    for (const thread of threads) {
      add(`/blog/thread/${thread.slug}`, { changeFrequency: 'weekly', priority: 0.6 });
    }
  }

  if (isModuleEnabled(settings?.toggles ?? {}, 'shop')) {
    const [sections, offers] = await Promise.all([
      listCatalogSections().catch(() => []),
      listOffers({ limit: 5000 }).catch(() => []),
    ]);
    add('/shop', { changeFrequency: 'weekly', priority: 0.9 });
    for (const section of sections) add(`/shop/${section.slug}`, { priority: 0.8 });
    for (const offer of offers) {
      if (offer.slug) add(`/shop/item/${offer.slug}`, { priority: 0.6 });
    }
  }

  return Array.from(entries.values());
}

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
