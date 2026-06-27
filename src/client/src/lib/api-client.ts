import type { FaqGroupDoc, PageDoc, ReusableBlockDoc, SiteSettings } from 'contracts';

/**
 * Минимальный generic-клиент к Payload CMS REST API для template-уровневых
 * collections (Pages / Media / Users / FormSubmissions / ReusableBlocks /
 * Posts / Comments) + global SiteSettings.
 *
 * Domain-методы (listDogs / listLittersInRange / searchRkf / listFaqGroups /
 * и т.п.) живут в инстансе под `lib/<domain>-api.ts` — НЕ здесь.
 *
 * R3 — `client/` знает только про `contracts`, никаких прямых импортов из
 * `cms/`.
 *
 * Базовый URL — `NEXT_PUBLIC_CMS_URL` (внутри Docker сети `http://cms:3001`,
 * локально вне Docker `http://localhost:3001`).
 */
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3001';

/**
 * Получить опубликованную страницу по slug. `''` означает главную (→ `home`).
 *
 * @returns страница или `null` если не найдена / не опубликована.
 */
export async function getPageBySlug(slug: string): Promise<PageDoc | null> {
  const query = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[_status][equals]': 'published',
    // depth=2 — populate media-uploads внутри array-полей блоков (например
    // BuiltWith.items[].screenshot, BlockShowcase.items[].preview).
    depth: '2',
    limit: '1',
  });

  const response = await fetch(`${CMS_URL}/api/pages?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { docs: PageDoc[] };
  return data.docs[0] ?? null;
}

/**
 * Получить страницу по id (для `PageRef` блока).
 */
export async function getPageById(id: string | number): Promise<PageDoc | null> {
  const response = await fetch(`${CMS_URL}/api/pages/${id}?depth=1`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return (await response.json()) as PageDoc;
}

/**
 * Получить глобальные настройки сайта (синглтон).
 *
 * @returns глобальные настройки или `null` если глобал ещё не заполнен.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const response = await fetch(`${CMS_URL}/api/globals/site-settings?depth=1`, {
    cache: 'no-store',
  });

  if (!response.ok) return null;

  return (await response.json()) as SiteSettings;
}

/**
 * Получить переиспользуемый блок-фрагмент по id (для `ReusableRef` блока).
 */
export async function getReusableBlockById(id: string | number): Promise<ReusableBlockDoc | null> {
  const response = await fetch(`${CMS_URL}/api/reusable-blocks/${id}?depth=1`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return (await response.json()) as ReusableBlockDoc;
}

/**
 * Получить FAQ-группы по slug'ам (для FaqAccordion блока).
 *
 * @param slugs — если массив пуст, возвращает все опубликованные группы.
 */
export async function listFaqGroups(slugs: readonly string[] = []): Promise<FaqGroupDoc[]> {
  const query = new URLSearchParams({ depth: '1', limit: '50' });
  if (slugs.length > 0) {
    query.append('where[slug][in]', slugs.join(','));
  }
  const response = await fetch(`${CMS_URL}/api/faq-groups?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: FaqGroupDoc[] };
  return data.docs;
}
