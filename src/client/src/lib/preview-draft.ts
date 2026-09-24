/**
 * Черновик предпросмотра: правка из формы админки, развёрнутая CMS без сохранения.
 *
 * @remarks
 * Панель предпросмотра присылает содержимое формы на каждое изменение, а
 * сохраняет статью редко - на медленной сети частое сохранение целой статьи
 * рвётся. Чтобы страница в панели видела правку раньше сохранения, маршрут
 * разворачивает присланное и кладёт сюда, а страница, собираясь заново,
 * берёт документ отсюда вместо последнего сохранённого.
 *
 * Запись одна на пропуск редактора: панель у человека одна, и хранить больше
 * последней правки незачем. Запись живёт минуту - закрытая панель не оставляет
 * черновик висеть в памяти, а открытая успевает прислать новую правку.
 */

/** Разделы, чью правку можно показать до сохранения. */
export const PREVIEW_COLLECTIONS = ['articles', 'pages'] as const;
export type PreviewCollection = (typeof PREVIEW_COLLECTIONS)[number];

export function isPreviewCollection(value: unknown): value is PreviewCollection {
  return PREVIEW_COLLECTIONS.includes(value as PreviewCollection);
}

/** Правка, присланная панелью предпросмотра. */
export interface PreviewDraftRequest {
  readonly collection: PreviewCollection;
  readonly id: string | number;
  readonly data: Record<string, unknown>;
  readonly locale?: string | undefined;
}

/**
 * Правка из тела запроса; `null` - присланное не правка документа.
 *
 * @remarks
 * Номер берётся из самих данных формы: админка кладёт его туда сама. Раздел -
 * только из списка: маршрут не должен разворачивать что попало.
 */
export function readPreviewDraftRequest(body: unknown): PreviewDraftRequest | null {
  if (!body || typeof body !== 'object') return null;
  const { collection, data, locale } = body as Record<string, unknown>;
  if (!isPreviewCollection(collection)) return null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const id = (data as Record<string, unknown>)['id'];
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  return {
    collection,
    id,
    data: data as Record<string, unknown>,
    ...(typeof locale === 'string' ? { locale } : {}),
  };
}

/** Сколько живёт черновик, мс. */
export const PREVIEW_DRAFT_TTL_MS = 60_000;

interface Entry {
  readonly collection: PreviewCollection;
  readonly id: string;
  readonly doc: unknown;
  readonly at: number;
}

export interface PreviewDraftStore {
  put(pass: string, collection: PreviewCollection, id: string | number, doc: unknown): void;
  /** Черновик того же раздела и номера, если он свежий; иначе `null`. */
  get(pass: string, collection: PreviewCollection, id: string | number): unknown;
}

export function createPreviewDraftStore(now: () => number = Date.now): PreviewDraftStore {
  const entries = new Map<string, Entry>();

  const sweep = () => {
    const edge = now() - PREVIEW_DRAFT_TTL_MS;
    for (const [pass, entry] of entries) if (entry.at < edge) entries.delete(pass);
  };

  return {
    put(pass, collection, id, doc) {
      sweep();
      entries.set(pass, { collection, id: String(id), doc, at: now() });
    },
    get(pass, collection, id) {
      sweep();
      const entry = entries.get(pass);
      return entry && entry.collection === collection && entry.id === String(id) ? entry.doc : null;
    },
  };
}

/*
  Хранилище одно на процесс. Обработчик маршрута и страница собираются
  разными модулями, и у каждого была бы своя копия - черновик, положенный
  маршрутом, страница бы не нашла.
*/
const KEY = Symbol.for('whg.previewDraftStore');

export function previewDrafts(): PreviewDraftStore {
  const holder = globalThis as { [KEY]?: PreviewDraftStore };
  holder[KEY] ??= createPreviewDraftStore();
  return holder[KEY];
}

/**
 * Документ для показа: черновик из панели, если он есть, иначе сохранённый.
 *
 * @remarks
 * Без пропуска черновика нет вовсе: посетитель видит только опубликованное.
 */
export function withPreviewDraft<T extends { id: string | number }>(
  doc: T | null,
  pass: string,
  collection: PreviewCollection,
  store: PreviewDraftStore = previewDrafts(),
): T | null {
  if (!doc || !pass) return doc;
  return (store.get(pass, collection, doc.id) as T | null) ?? doc;
}
