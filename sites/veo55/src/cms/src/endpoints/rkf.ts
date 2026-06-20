import type { Endpoint } from 'payload';

import { parseDog } from '../lib/rkf/parser';
import { searchDogs } from '../lib/rkf/search';

/**
 * Кастомные endpoints для РКФ-парсера. Регистрируются через `endpoints: []`
 * в `payload.config.ts`. Доступны как `GET /api/rkf/dog?id=N` и
 * `GET /api/rkf/search?q=X&page=N`.
 *
 * @remarks
 * Server-only. Используется client-кодом `/catalog/page.tsx` для:
 *  - autocomplete-dropdown (`?q=X` → top items)
 *  - search-results page (`?q=X&page=N` → одна страница ~40 items)
 *  - dog-card по rkfId (`?id=N` → полная карточка + pedigree)
 *
 * Кеш per-id / per-(name,page) на 7 дней (см. `cache.ts`).
 *
 * Доступ — публичный (no auth): эти endpoints читают РКФ, не нашу БД.
 */
export const rkfEndpoints: Endpoint[] = [
  {
    path: '/rkf/dog',
    method: 'get',
    handler: async (req) => {
      const idRaw = req.query?.id;
      const id = Number(Array.isArray(idRaw) ? idRaw[0] : idRaw);
      if (!Number.isFinite(id) || id < 1) {
        return Response.json({ error: 'invalid id' }, { status: 400 });
      }
      try {
        const dog = await parseDog(id);
        if (!dog) {
          return Response.json({ error: 'not found' }, { status: 404 });
        }
        return Response.json(dog, {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err) {
        req.payload.logger.error(
          `[rkf/dog] id=${id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        return Response.json({ error: 'fetch failed' }, { status: 502 });
      }
    },
  },
  {
    path: '/rkf/search',
    method: 'get',
    handler: async (req) => {
      const qRaw = req.query?.q ?? req.query?.name;
      const q = String(Array.isArray(qRaw) ? qRaw[0] : (qRaw ?? '')).trim();
      const pageRaw = req.query?.page ?? req.query?.p;
      const page = Math.max(1, Number(Array.isArray(pageRaw) ? pageRaw[0] : (pageRaw ?? 1)) || 1);
      if (q.length < 2) {
        return Response.json({
          query: q,
          page,
          count: 0,
          hasMore: false,
          items: [],
        });
      }
      try {
        const r = await searchDogs(q, page);
        return Response.json(
          {
            query: q,
            page,
            count: r.items.length,
            hasMore: r.hasMore,
            items: r.items,
          },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      } catch (err) {
        req.payload.logger.error(
          `[rkf/search] q="${q}" p=${page}: ${err instanceof Error ? err.message : String(err)}`,
        );
        return Response.json({ error: 'search failed' }, { status: 502 });
      }
    },
  },
];
