/**
 * In-memory cache с TTL (hard + soft) — stale-while-revalidate.
 *
 * @remarks
 * 1:1 с logic `veo_cached_or_revalidate` из legacy `dog-helpers.php`:
 *  - возраст < softTtl: отдаём из кеша синхронно
 *  - softTtl <= age < hardTtl: отдаём кеш + background refresh
 *  - возраст >= hardTtl: синхронно вычисляем заново
 *
 * Persistence: не делаем. При рестарте CMS кеш прогревается заново (РКФ
 * парсер быстрый, ~1-2 сек на собаку с кешем РКФ-сервера).
 *
 * Server-only (Node). НЕ импортить из client.
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export interface CacheOptions {
  /** Hard TTL в секундах. После него — synchronously refetch. */
  hardTtlSec: number;
  /** Soft TTL в секундах. После него — отдаём кеш + background refetch. */
  softTtlSec: number;
}

/**
 * Получить из кеша или вычислить через producer. Идемпотентно — если
 * несколько одновременных вызовов для одного key, fetcher выполняется один раз.
 */
export async function cached<T>(
  key: string,
  opts: CacheOptions,
  producer: () => Promise<T | null>,
): Promise<T | null> {
  const now = Date.now() / 1000;
  const entry = store.get(key) as CacheEntry<T> | undefined;
  const age = entry ? now - entry.ts : Number.POSITIVE_INFINITY;

  // 1. Свежий — отдаём как есть
  if (entry && age < opts.softTtlSec) {
    return entry.data;
  }

  // 2. Устаревший, но в пределах hard TTL — отдаём кеш, обновляем в фоне
  if (entry && age < opts.hardTtlSec) {
    if (!inFlight.has(key)) {
      const promise = (async () => {
        try {
          const fresh = await producer();
          if (fresh !== null) {
            store.set(key, { data: fresh, ts: now });
          }
        } catch {
          // молча: при ошибке кеш остаётся прежним до следующей попытки
        } finally {
          inFlight.delete(key);
        }
      })();
      inFlight.set(key, promise);
    }
    return entry.data;
  }

  // 3. Холодный кеш или просрочен — синхронно. Coalescing: если уже идёт
  // запрос на этот key, ждём его (не запускаем второй).
  const existing = inFlight.get(key) as Promise<T | null> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const fresh = await producer();
      if (fresh !== null) {
        store.set(key, { data: fresh, ts: Date.now() / 1000 });
      }
      return fresh;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);
  return promise;
}

/** Сбросить весь кеш (для тестов / админ-команды). */
export function cacheClear(): void {
  store.clear();
  inFlight.clear();
}
