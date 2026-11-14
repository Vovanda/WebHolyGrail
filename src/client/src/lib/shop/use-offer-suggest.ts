'use client';

import type { OfferView } from 'contracts';
import { useEffect, useState } from 'react';

/** С какой длины запроса искать и сколько ждать паузы в наборе. */
const MIN_QUERY = 2;
const PAUSE_MS = 300;

/**
 * Позиции по набираемому запросу - для выпадающего списка под полем поиска.
 *
 * @remarks
 * Ищет сервер тем же поиском, что раздел каталога: опечатки и набор в другой
 * раскладке находят позицию. Запрос уходит после паузы в наборе, прежний
 * отменяется. Короче двух знаков - списка нет (`null`).
 */
export function useOfferSuggest(query: string): OfferView[] | null {
  const [found, setFound] = useState<OfferView[] | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) return setFound(null);
    const stop = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/internal/shop/offers?q=${encodeURIComponent(q)}`, { signal: stop.signal })
        .then((r) => (r.ok ? r.json() : { docs: [] }))
        .then((d: { docs: OfferView[] }) => setFound(d.docs))
        .catch(() => undefined);
    }, PAUSE_MS);
    return () => {
      clearTimeout(timer);
      stop.abort();
    };
  }, [query]);

  return found;
}
