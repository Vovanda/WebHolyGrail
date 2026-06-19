import type { PageDoc, SiteSettings } from '@veo55/contracts';

/**
 * Минимальный клиент к Payload CMS REST API.
 *
 * @remarks
 * Знаем только про `@veo55/contracts` — никаких импортов из `cms/` (R3).
 * Возвращаемые типы (`PageDoc`, `SiteSettings`) — публичный контракт,
 * не внутренние Payload-типы.
 *
 * Базовый URL — `NEXT_PUBLIC_CMS_URL` (внутри Docker сети `http://cms:3001`,
 * локально вне Docker `http://localhost:3001`).
 */

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3001';

/**
 * Получить опубликованную страницу по slug. `''` означает главную.
 *
 * @returns страница или `null` если не найдена / не опубликована.
 */
export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const query = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[_status][equals]': 'published',
    depth: '1',
    limit: '1',
  });

  const response = await fetch(`${CMS_URL}/api/pages?${query.toString()}`, {
    next: { revalidate: 60, tags: ['pages', `page:${slug}`] },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { docs: PageDoc[] };
  return data.docs[0] ?? null;
}

/**
 * Получить глобальные настройки сайта (синглтон).
 *
 * @returns глобальные настройки или `null` если глобал ещё не заполнен.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const response = await fetch(`${CMS_URL}/api/globals/site-settings?depth=1`, {
    next: { revalidate: 300, tags: ['site-settings'] },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SiteSettings;
}
