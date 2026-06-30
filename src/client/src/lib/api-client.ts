import type {
  BlogArticle,
  BlogAuthor,
  BlogTag,
  BlogThread,
  FaqGroupDoc,
  PageDoc,
  ReusableBlockDoc,
  SiteSettings,
} from 'contracts';

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

// ─── Blog (#43 epic) ───────────────────────────────────────────────────

export interface ListArticlesParams {
  readonly limit?: number;
  readonly page?: number;
  readonly tagSlug?: string;
  readonly threadSlug?: string;
  readonly authorSlug?: string;
  readonly sort?: 'newest' | 'oldest';
}

export interface ListArticlesResult {
  readonly docs: ReadonlyArray<BlogArticle>;
  readonly totalDocs: number;
  readonly totalPages: number;
  readonly page: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
}

/**
 * Список опубликованных Articles с pagination + optional filters.
 * Filters: tagSlug / threadSlug / authorSlug (выполняются через nested where).
 */
export async function listArticles(params: ListArticlesParams = {}): Promise<ListArticlesResult> {
  const query = new URLSearchParams({
    'where[status][equals]': 'published',
    depth: '2',
    limit: String(params.limit ?? 10),
    page: String(params.page ?? 1),
    sort: params.sort === 'oldest' ? 'publishedAt' : '-publishedAt',
  });
  if (params.tagSlug) query.append('where[tags.slug][equals]', params.tagSlug);
  if (params.threadSlug) query.append('where[thread.slug][equals]', params.threadSlug);
  if (params.authorSlug) query.append('where[author.slug][equals]', params.authorSlug);
  const response = await fetch(`${CMS_URL}/api/articles?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok)
    return {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  return (await response.json()) as ListArticlesResult;
}

export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const query = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '2',
    limit: '1',
  });
  const response = await fetch(`${CMS_URL}/api/articles?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: BlogArticle[] };
  return data.docs[0] ?? null;
}

export async function getThreadBySlug(slug: string): Promise<BlogThread | null> {
  const query = new URLSearchParams({
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    depth: '1',
    limit: '1',
  });
  const response = await fetch(`${CMS_URL}/api/threads?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: BlogThread[] };
  return data.docs[0] ?? null;
}

export async function getTagBySlug(slug: string): Promise<BlogTag | null> {
  const query = new URLSearchParams({ 'where[slug][equals]': slug, depth: '0', limit: '1' });
  const response = await fetch(`${CMS_URL}/api/tags?${query.toString()}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: BlogTag[] };
  return data.docs[0] ?? null;
}

export async function getAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  const query = new URLSearchParams({ 'where[slug][equals]': slug, depth: '1', limit: '1' });
  const response = await fetch(`${CMS_URL}/api/authors?${query.toString()}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: BlogAuthor[] };
  return data.docs[0] ?? null;
}

export async function listAllTags(): Promise<ReadonlyArray<BlogTag>> {
  const response = await fetch(`${CMS_URL}/api/tags?limit=100&depth=0`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: BlogTag[] };
  return data.docs;
}
