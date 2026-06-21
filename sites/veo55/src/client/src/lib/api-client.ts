import type {
  DogDoc,
  LitterDoc,
  PageDoc,
  ReusableBlockDoc,
  RkfDogDoc,
  RkfSearchPage,
  SiteSettings,
} from '@veo55/contracts';

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
    cache: 'no-store',
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
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SiteSettings;
}

/**
 * Получить помёт по id с populated родителями (depth=2 — Litter → Dogs → Media).
 *
 * @remarks
 * Возвращает помёт независимо от `status` (фильтрация active/archived/hidden —
 * на стороне рендера блока, а не запроса; админ может попросить превью скрытого
 * помёта). `_status: published` Payload-доступа отрабатывает на read-уровне
 * (см. `Litters.access.read`).
 */
export async function getLitterById(id: string): Promise<LitterDoc | null> {
  // findByID `/api/litters/<id>` падает 500 для Litters на всех depth (даже 0)
  // в текущей версии Payload — баг в обработке schema/lockedDocuments. Find
  // через `where[id][equals]` работает стабильно. См. тот же обходной путь
  // в `getPageById`.
  const params = new URLSearchParams({
    'where[id][equals]': id,
    depth: '2',
    limit: '1',
  });
  const response = await fetch(`${CMS_URL}/api/litters?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs?: LitterDoc[] };
  return data.docs?.[0] ?? null;
}

/**
 * Получить нашу curated собаку по slug (depth=1 — populated photos.image media).
 *
 * @returns DogDoc или null если не найден / не опубликован.
 *
 * @remarks
 * **Canonical URL `/dog/<slug>`** — это поле работает (R13). Только наши Dogs;
 * чужие (не зарегистрированные у нас) живут в /catalog (live-proxy РКФ
 * через catalog.php) и сюда не попадают.
 */
/**
 * Получить собаку по id Payload-документа. Используется в блоках, которые
 * параметризованы relation'ом к Dogs (например, `pedigree`).
 */
export async function getDogById(id: string): Promise<DogDoc | null> {
  const response = await fetch(`${CMS_URL}/api/dogs/${encodeURIComponent(id)}?depth=1`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return (await response.json()) as DogDoc;
}

export async function getDogBySlug(slug: string): Promise<DogDoc | null> {
  const query = new URLSearchParams({
    'where[slug][equals]': slug,
    depth: '1',
    limit: '1',
  });
  const response = await fetch(`${CMS_URL}/api/dogs?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: DogDoc[] };
  return data.docs[0] ?? null;
}

/**
 * Список наших собак (коллекция Dogs). Используется на странице каталога
 * `/catalog`. depth=1 чтобы получить populated photos[].image.
 *
 * @param sex — фильтр по полу, опционально
 */
export async function listDogs(sex?: 'male' | 'female'): Promise<readonly DogDoc[]> {
  const params = new URLSearchParams({ depth: '1', limit: '200', sort: '-dob' });
  if (sex) params.set('where[sex][equals]', sex);
  const response = await fetch(`${CMS_URL}/api/dogs?${params.toString()}`, { cache: 'no-store' });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: DogDoc[] };
  return data.docs;
}

/**
 * Получить помёт по `dob+letter` — используется в generic-fallback маршрута
 * `/puppies/<dob>/<letter>` когда кастомная Pages-запись отсутствует.
 */
export async function getLitterByDobLetter(dob: string, letter: string): Promise<LitterDoc | null> {
  const query = new URLSearchParams({
    'where[and][0][dob][greater_than_equal]': `${dob}T00:00:00.000Z`,
    'where[and][1][dob][less_than]': `${dob}T23:59:59.999Z`,
    'where[and][2][letter][equals]': letter,
    depth: '2',
    limit: '1',
  }).toString();
  const response = await fetch(`${CMS_URL}/api/litters?${query}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs: LitterDoc[] };
  return data.docs[0] ?? null;
}

/**
 * Список помётов с фильтром по диапазону `dob`. Используется для list-страниц
 * `/puppies`, `/puppies/<year>`, `/puppies/<year-month>` и т.п.
 *
 * @param fromIso — начало диапазона включительно (`YYYY-MM-DDT00:00:00.000Z`)
 * @param toIso — конец диапазона исключительно
 */
export async function listLittersInRange(
  fromIso: string | null,
  toIso: string | null,
): Promise<readonly LitterDoc[]> {
  const params = new URLSearchParams({ depth: '1', limit: '200', sort: '-dob' });
  let idx = 0;
  if (fromIso) {
    params.set(`where[and][${idx}][dob][greater_than_equal]`, fromIso);
    idx++;
  }
  if (toIso) {
    params.set(`where[and][${idx}][dob][less_than]`, toIso);
    idx++;
  }
  const response = await fetch(`${CMS_URL}/api/litters?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { docs: LitterDoc[] };
  return data.docs;
}

/**
 * Все комменты для набора постов, одним запросом. Сортировка по дате ASC
 * (top-level комменты + replies в одной flat-выдаче). Дерево replies
 * собирается на клиенте по `parentId`.
 *
 * Используется в SocialFeedServer для подгрузки comments при рендере /news.
 */
export async function listCommentsForPosts(
  postIds: ReadonlyArray<string | number>,
): Promise<readonly import('@veo55/contracts').SocialComment[]> {
  if (postIds.length === 0) return [];
  const params = new URLSearchParams({ depth: '0', limit: '5000', sort: 'date' });
  postIds.forEach((id, i) => {
    params.set(`where[post][in][${i}]`, String(id));
  });
  params.set('where[hidden][not_equals]', 'true');
  const response = await fetch(`${CMS_URL}/api/comments?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    docs: ReadonlyArray<import('@veo55/contracts').SocialComment & { post: number | string }>;
  };
  return data.docs;
}

/**
 * Список постов из коллекции `posts` (синхронизируется через `pnpm sync:vk-posts`).
 * Сортировка по дате DESC. Используется блоком `social-feed`.
 */
export async function listPosts(opts: {
  sources?: ReadonlyArray<'vk' | 'tg' | 'ig'>;
  limit?: number;
}): Promise<readonly import('@veo55/contracts').SocialPostDoc[]> {
  const limit = opts.limit ?? 100;
  const params = new URLSearchParams({ depth: '1', limit: String(limit), sort: '-date' });
  const sources = opts.sources ?? ['vk', 'tg', 'ig'];
  sources.forEach((s, i) => {
    params.set(`where[and][${i}][source][equals]`, s);
  });
  // Если `or`-фильтр для нескольких source нужен — придётся переделать. Сейчас
  // у нас всегда только один источник на блок (VK), and-фильтр совпадает.
  const response = await fetch(`${CMS_URL}/api/posts?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    docs: ReadonlyArray<import('@veo55/contracts').SocialPostDoc>;
  };
  return data.docs;
}

/**
 * Получить переиспользуемый блок по id с populated содержимым (depth=2 — нужны
 * вложенные relations внутри `content`-блоков).
 */
export async function getReusableBlockById(id: string | number): Promise<ReusableBlockDoc | null> {
  const response = await fetch(
    `${CMS_URL}/api/reusable-blocks/${encodeURIComponent(String(id))}?depth=2`,
    { cache: 'no-store' },
  );
  if (!response.ok) return null;
  return (await response.json()) as ReusableBlockDoc;
}

/**
 * Получить страницу по id для встраивания через `page-ref`.
 *
 * @remarks
 * REST `/api/pages/<id>?depth=2` иногда падает 500 в `findByID` при
 * populated relations внутри блоков (Payload что-то ломает на циклах /
 * глубоких relations). Используем `find` через `where[id][equals]=` —
 * работает стабильно даже с depth=2 для page-ref-вложений.
 */
export async function getPageById(id: string | number): Promise<PageDoc | null> {
  // depth=0: только id-relations, без populated. Сами litter-* / pedigree /
  // social-feed-блоки внутри страницы сами тянут свои данные (через
  // getLitterById, getDogById и т.д.) — там depth работает корректно.
  // С depth>=1 здесь Payload падает 500 в нашей схеме (вероятно из-за глубоких
  // populated relations внутри блоков).
  const params = new URLSearchParams({
    'where[id][equals]': String(id),
    depth: '0',
    limit: '1',
  });
  const response = await fetch(`${CMS_URL}/api/pages?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { docs?: PageDoc[] };
  return data.docs?.[0] ?? null;
}

/**
 * Получить карточку собаки из РКФ-каталога (`veorkf.ru`). Server-side fetch
 * через Payload endpoint `/api/rkf/dog?id=N` — там же кеш 7д/1д.
 *
 * @returns карточка или `null` если РКФ не отдал собаку (404 / parse fail).
 */
export async function getRkfDog(id: number): Promise<RkfDogDoc | null> {
  if (!Number.isFinite(id) || id < 1) return null;
  // Кеширование живёт на стороне Payload-endpoint'а (RKF cache 7д/1д).
  // Next-fetch ставит `no-store`, иначе при изменении парсера фронт держит
  // устаревшую сериализацию (см. историю с position/rkfId).
  const response = await fetch(`${CMS_URL}/api/rkf/dog?id=${id}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = (await response.json()) as RkfDogDoc | { error: string };
  if ('error' in data) return null;
  return data;
}

/**
 * Поиск собак на РКФ по части клички. Возвращает одну страницу (~40 items) с
 * признаком `hasMore`. Server-side fetch через Payload endpoint
 * `/api/rkf/search?q=X&page=N` — там же кеш 7д/1д на (name, page).
 */
export async function searchRkf(query: string, page = 1): Promise<RkfSearchPage> {
  const q = query.trim();
  if (q.length < 2) {
    return { query: q, page, count: 0, hasMore: false, items: [] };
  }
  const params = new URLSearchParams({ q, page: String(page) });
  const response = await fetch(`${CMS_URL}/api/rkf/search?${params.toString()}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) return { query: q, page, count: 0, hasMore: false, items: [] };
  return (await response.json()) as RkfSearchPage;
}
