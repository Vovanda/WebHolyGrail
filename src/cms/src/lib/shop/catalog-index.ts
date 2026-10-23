import {
  ancestorsOf,
  type CatalogItem,
  type CatalogSectionView,
  microsToUnits,
  sectionTree,
  type SectionNode,
} from 'contracts';

import type { CatalogCard, CatalogData } from './ports';

/** Позиция индекса: карточка, вид для фильтра и ключи сортировки. */
export interface CatalogEntry {
  readonly card: CatalogCard;
  readonly item: CatalogItem;
  /** Цена в единицах валюты; без цены - null. */
  readonly price: number | null;
  /** Скидка акции в процентах; без акции - 0. */
  readonly discount: number;
  readonly created: string;
}

/** Собранный индекс: позиции в порядке «по умолчанию» и разделы. */
export interface CatalogSnapshot {
  readonly entries: readonly CatalogEntry[];
  readonly bySection: ReadonlyMap<string, readonly CatalogEntry[]>;
  readonly sections: readonly CatalogSectionView[];
  /** Дерево разделов со счётом позиций вместе с подразделами. */
  readonly tree: readonly SectionNode[];
}

export interface CatalogIndex {
  /**
   * Индекс без ожидания пересборки: прежний снимок, пока новый собирается в фоне.
   * Ждёт только самую первую сборку.
   */
  get(): Promise<CatalogSnapshot>;
  /** Дождаться фоновой пересборки, если она идёт, - для прогрева и проверок. */
  idle(): Promise<void>;
}

/** Позиция индекса из карточки: значения общих характеристик - из её полей. */
export function entryOf(card: CatalogCard, sectionTitle: string | null = null): CatalogEntry {
  const price = card.price !== null && card.price > 0 ? microsToUnits(card.price) : null;
  const list = card.listPrice !== null ? microsToUnits(card.listPrice) : null;
  const discount =
    price !== null && list !== null && list > price ? Math.round(((list - price) / list) * 100) : 0;
  return {
    card,
    item: {
      id: card.id,
      title: card.title,
      sku: card.sku,
      keywords: card.keywords,
      section: card.section,
      sectionTitle,
      summary: card.summary,
      specs: {
        ...card.specs,
        'in-stock': card.stock === null || card.stock > 0,
        sale: discount > 0,
        price,
      },
    },
    price,
    discount,
    created: card.createdAt,
  };
}

/** Индекс из данных хранилища. */
export function snapshotOf(data: CatalogData): CatalogSnapshot {
  const titles = new Map(data.sections.map((s) => [s.slug, s.title]));
  const entries = data.cards.map((card) =>
    entryOf(card, card.section ? (titles.get(card.section) ?? null) : null),
  );
  // Позиция видна в своём разделе и во всех его предках: «Инструмент» показывает и перфораторы.
  const ancestors = new Map(data.sections.map((s) => [s.slug, ancestorsOf(data.sections, s.slug)]));
  const bySection = new Map<string, CatalogEntry[]>();
  const own = new Map<string, number>();
  for (const entry of entries) {
    const slug = entry.card.section;
    if (!slug) continue;
    own.set(slug, (own.get(slug) ?? 0) + 1);
    for (const at of [slug, ...(ancestors.get(slug) ?? [])]) {
      const list = bySection.get(at);
      if (list) list.push(entry);
      else bySection.set(at, [entry]);
    }
  }
  return {
    entries,
    bySection,
    sections: data.sections,
    tree: sectionTree(data.sections, own),
  };
}

/** Ближайший конец акции после `now`; нет таких - бесконечность. */
function nextPromoEdge(cards: readonly CatalogCard[], now: number): number {
  let edge = Number.POSITIVE_INFINITY;
  for (const card of cards) {
    const at = card.promoUntil ? Date.parse(card.promoUntil) : Number.NaN;
    if (Number.isFinite(at) && at > now && at < edge) edge = at;
  }
  return edge;
}

/**
 * Индекс каталога в памяти процесса (docs/whg/44-catalog-search.md, «Выдача страницами»).
 *
 * @remarks
 * Экземпляров CMS бывает несколько, поэтому свежесть держится не хуками правки,
 * а сверкой версии данных: не чаще раза в `checkEveryMs` индекс спрашивает
 * версию и пересобирается, если она другая. Цена зависит от времени - акция
 * кончается в `promoUntil`, - поэтому индекс пересобирается и тогда, когда
 * наступил ближайший конец акции.
 *
 * Пересборка идёт в фоне, а запросы получают прежний снимок (stale-while-revalidate):
 * чтение десяти тысяч позиций через Payload занимает секунды, и покупатель не
 * должен их ждать. Правка становится видна, когда пересборка закончилась. Ждёт
 * только самая первая сборка - её делают при старте CMS. Упавшая пересборка
 * оставляет прежний снимок, следующая сверка попробует снова.
 */
export function catalogIndex(source: {
  readonly load: () => Promise<CatalogData>;
  readonly version: () => Promise<string>;
  readonly checkEveryMs?: number;
  readonly now?: () => number;
  /** Подготовить свежий снимок до того, как он начнёт отвечать: индекс поиска и т.п. */
  readonly prepare?: (snapshot: CatalogSnapshot) => void;
}): CatalogIndex {
  const every = source.checkEveryMs ?? 1000;
  const now = source.now ?? Date.now;
  let built: {
    snapshot: CatalogSnapshot;
    version: string;
    checkedAt: number;
    expiresAt: number;
  } | null = null;
  let pending: Promise<CatalogSnapshot> | null = null;

  const rebuild = async (version: string): Promise<CatalogSnapshot> => {
    const data = await source.load();
    const snapshot = snapshotOf(data);
    source.prepare?.(snapshot);
    const at = now();
    built = {
      snapshot,
      version,
      checkedAt: at,
      expiresAt: nextPromoEdge(data.cards, at),
    };
    return built.snapshot;
  };

  const refresh = async (): Promise<CatalogSnapshot> => {
    const version = await source.version();
    const at = now();
    if (built && built.version === version && at < built.expiresAt) {
      built.checkedAt = at;
      return built.snapshot;
    }
    return rebuild(version);
  };

  const start = (): Promise<CatalogSnapshot> => {
    pending ??= refresh().finally(() => {
      pending = null;
    });
    return pending;
  };

  return {
    get() {
      if (!built) return start();
      const at = now();
      if (at - built.checkedAt >= every || at >= built.expiresAt) {
        // Прежний снимок отвечает сразу; ошибка фона не роняет запрос.
        start().catch(() => undefined);
      }
      return Promise.resolve(built.snapshot);
    },
    async idle() {
      await pending?.catch(() => undefined);
    },
  };
}
