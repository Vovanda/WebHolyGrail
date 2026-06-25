import type { MetadataRoute } from 'next';

import { getSiteSettings, listDogs, listLittersInRange, searchRkf } from '@/lib/api-client';

/**
 * `/sitemap.xml` — автогенерируемый sitemap.
 *
 * Стратегия SEO («защищённая агрегация» из legacy + усиление):
 *  1. Все URL из главного меню (`siteSettings.mainNav`) — заводчик меняет в админке,
 *     sitemap подхватывает автоматом, не нужно отдельно править.
 *  2. CMS-pages (всё что есть в `pages` коллекции) — те что не в меню тоже индексируем,
 *     потому что они доступны через discovery.
 *  3. Наши собаки `/dog/[slug]` — все, актуальный список из `dogs` коллекции.
 *  4. Помёты `/puppies/<dob>/<letter>` — все из `litters` коллекции.
 *  5. РКФ собаки нашей приставки `/catalog?dog=<rkfId>` — поиск по "Омская Дружина"
 *     с пагинацией. Это даёт **наши** карточки в выдаче Google рядом с veorkf.ru
 *     для каждой собаки питомника. Чужие RKF собаки в sitemap не входят (легаси
 *     стратегия — не тратим crawl budget), но доступны через ссылки на нашем сайте
 *     (discovery).
 *
 * Кеш — `revalidate: 3600` (час). Поиск РКФ медленный (~30 сек на ~10 страниц),
 * но один раз в час норм.
 */
export const revalidate = 3600;

const KENNEL_NAME = 'Омская Дружина';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veo55.ru';
  const now = new Date();

  // 1. Static + nav-driven URLs
  const settings = await getSiteSettings();
  const navUrls = new Set<string>();
  if (settings?.mainNav) {
    for (const item of settings.mainNav) {
      if (item.href && !item.external && item.href.startsWith('/')) {
        navUrls.add(item.href);
      }
    }
  }
  // Гарантированные точки входа (даже если их нет в меню)
  navUrls.add('/');
  navUrls.add('/catalog');

  const staticEntries: MetadataRoute.Sitemap = Array.from(navUrls).map((path) => ({
    url: `${baseUrl}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1.0 : 0.8,
  }));

  // 2. CMS Pages (не дублируя уже в navUrls)
  // TODO: добавить когда появится listPages() в api-client — сейчас pages через
  // catch-all маршрут `/[[...slug]]`, slug-list нужно отдельно запрашивать.

  // 3. Our dogs
  const dogs = await listDogs().catch(() => []);
  const dogEntries: MetadataRoute.Sitemap = dogs.map((d) => ({
    url: `${baseUrl}/dog/${d.slug}`,
    lastModified: d.updatedAt ? new Date(d.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 4. Litters (puppy-pages)
  const litters = await listLittersInRange(null, null).catch(() => []);
  const litterEntries: MetadataRoute.Sitemap = litters
    .filter((l) => l.dob && l.letter && l.status !== 'hidden')
    .map((l) => {
      const dob = (l.dob ?? '').slice(0, 10); // YYYY-MM-DD
      return {
        url: `${baseUrl}/puppies/${dob}/${l.letter}`,
        lastModified: l.updatedAt ? new Date(l.updatedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

  // 5. РКФ собаки с приставкой питомника. Многостраничный paginate через hasMore.
  // Фильтр: исключаем тех у кого rkfId есть в наших Dogs — они уже представлены
  // через /dog/<slug> (canonical). /catalog?dog=N для них redirect'ит — дубль
  // не нужен в sitemap.
  const ourRkfIds = new Set(dogs.map((d) => d.rkfId).filter((id): id is number => Boolean(id)));

  const rkfEntries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    while (page <= 20) {
      const result = await searchRkf(KENNEL_NAME, page);
      if (!result.items || result.items.length === 0) break;
      for (const dog of result.items) {
        if (dog.id && !ourRkfIds.has(dog.id)) {
          rkfEntries.push({
            url: `${baseUrl}/catalog?dog=${dog.id}`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      }
      if (!result.hasMore) break;
      page++;
    }
  } catch {
    // РКФ недоступен — сitemap соберётся без catalog. Не fatal.
  }

  return [...staticEntries, ...dogEntries, ...litterEntries, ...rkfEntries];
}
