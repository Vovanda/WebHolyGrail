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

/**
 * Статьи по списку id, в порядке переданных id.
 *
 * @remarks
 * Payload не гарантирует порядок при `where[id][in]`, а редактор в админке
 * расставляет статьи руками — порядок значим, поэтому пересортировываем на
 * нашей стороне.
 */
export async function listArticlesByIds(
  ids: ReadonlyArray<string | number>,
): Promise<ReadonlyArray<BlogArticle>> {
  if (ids.length === 0) return [];
  const query = new URLSearchParams({
    'where[status][equals]': 'published',
    'where[id][in]': ids.join(','),
    depth: '2',
    limit: String(ids.length),
  });
  const response = await fetch(`${CMS_URL}/api/articles?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: BlogArticle[] };
  const order = new Map(ids.map((id, index) => [String(id), index]));
  return [...data.docs].sort(
    (a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0),
  );
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

export async function listAllThreads(): Promise<ReadonlyArray<BlogThread>> {
  const query = new URLSearchParams({
    'where[status][equals]': 'published',
    limit: '200',
    depth: '0',
  });
  const response = await fetch(`${CMS_URL}/api/threads?${query.toString()}`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: BlogThread[] };
  return data.docs;
}

// ─── Sitemap ───────────────────────────────────────────────────────────

/** Минимум, который нужен sitemap'у от произвольной записи. */
export interface SitemapEntryDoc {
  readonly slug: string;
  readonly updatedAt?: string;
}

/**
 * Все опубликованные страницы из `Pages`.
 *
 * @remarks
 * Sitemap строится по содержимому CMS, а не по пунктам меню: страница может
 * существовать и быть нужной поисковику, не появляясь в навигации (лендинг
 * из рассылки, юридическая страница).
 */
export async function listAllPages(): Promise<ReadonlyArray<SitemapEntryDoc>> {
  const query = new URLSearchParams({
    'where[_status][equals]': 'published',
    limit: '500',
    depth: '0',
  });
  const response = await fetch(`${CMS_URL}/api/pages?${query.toString()}`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: SitemapEntryDoc[] };
  return data.docs;
}

// ─── Каталог специалистов ──────────────────────────────────────────────

/** Город каталога — как его отдаёт CMS. */
export interface CityDoc {
  readonly id: number | string;
  readonly name: string;
  readonly slug?: string;
  readonly order?: number;
}

/** Карточка специалиста. Полный документ приходит на его личной странице. */
export interface SpecialistDoc {
  readonly id: number | string;
  readonly fullName: string;
  readonly nickname?: string;
  readonly slug?: string;
  readonly headline?: string;
  readonly bio?: string;
  readonly acceptingClients?: boolean;
  readonly rating?: number;
  readonly ratingPublic?: boolean;
  readonly boost?: number;
  readonly requestsCount?: number;
  readonly photo?: unknown;
  readonly city?: CityDoc | number | string | null;
  readonly disciplines?: ReadonlyArray<{ readonly title?: string }>;
  readonly credentials?: ReadonlyArray<{ readonly title?: string; readonly note?: string }>;
  readonly facts?: ReadonlyArray<{ readonly text?: string }>;
  readonly locations?: ReadonlyArray<{
    readonly title?: string;
    readonly address?: string;
    readonly note?: string;
    readonly mapUrl?: string;
  }>;
  readonly contacts?: {
    readonly phone?: string;
    readonly email?: string;
    readonly telegram?: string;
    readonly whatsapp?: string;
    readonly vk?: string;
    readonly site?: string;
  };
  readonly blocks?: ReadonlyArray<unknown>;
}

/** Города каталога, по возрастанию `order`, затем по алфавиту. */
export async function listCities(): Promise<ReadonlyArray<CityDoc>> {
  const query = new URLSearchParams({ limit: '200', depth: '0', sort: 'order,name' });
  const response = await fetch(`${CMS_URL}/api/cities?${query.toString()}`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: CityDoc[] };
  return data.docs;
}

/**
 * Специалисты каталога.
 *
 * @remarks
 * `cache: 'no-store'` осознанно: каталог меняется в админке и должен
 * отражаться сразу, а не после следующей сборки.
 */
export async function listSpecialists(options?: {
  readonly cityId?: string | number;
  readonly onlyAccepting?: boolean;
  readonly limit?: number;
}): Promise<ReadonlyArray<SpecialistDoc>> {
  const query = new URLSearchParams({
    limit: String(options?.limit ?? 100),
    depth: '1',
  });
  if (options?.cityId !== undefined) query.set('where[city][equals]', String(options.cityId));
  if (options?.onlyAccepting) query.set('where[acceptingClients][equals]', 'true');

  const response = await fetch(`${CMS_URL}/api/specialists?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: SpecialistDoc[] };
  return data.docs;
}

/** Один специалист по адресу страницы. `null`, если такого нет. */
export async function getSpecialistBySlug(slug: string): Promise<SpecialistDoc | null> {
  const query = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
    depth: '2',
  });
  const response = await fetch(`${CMS_URL}/api/specialists?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: SpecialistDoc[] };
  return data.docs[0] ?? null;
}

/** Сколько специалистов в каждом городе — для витрины по городам. */
export async function countSpecialistsByCity(options?: {
  readonly onlyAccepting?: boolean;
}): Promise<ReadonlyMap<string, number>> {
  const people = await listSpecialists({
    ...(options?.onlyAccepting ? { onlyAccepting: true } : {}),
    limit: 500,
  });
  const counts = new Map<string, number>();
  for (const person of people) {
    const city = person.city;
    const id = city && typeof city === 'object' ? String((city as CityDoc).id) : String(city ?? '');
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
