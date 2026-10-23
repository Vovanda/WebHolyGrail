import type { Payload } from 'payload';

import { catalogIndex, type CatalogIndex } from './catalog-index';
import { prepareSearch } from './catalog-query';
import { payloadPorts } from './payload-store';

/**
 * Индекс каталога - один на процесс CMS (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Читает без запроса пользователя: индекс общий для всех, а не принадлежит
 * чьей-то транзакции. Свежесть держит сверка версии данных, а не хуки правки.
 */
let shared: CatalogIndex | null = null;

export function catalogFor(payload: Payload): CatalogIndex {
  if (!shared) {
    const store = payloadPorts(payload).offers;
    shared = catalogIndex({
      load: () => store.catalog(),
      version: () => store.catalogVersion(),
      prepare: prepareSearch,
    });
  }
  return shared;
}

/**
 * Первая сборка индекса при старте CMS: первый покупатель после выкладки не
 * ждёт секунды чтения каталога. Ошибка не мешает запуску - индекс соберётся
 * на первом запросе.
 */
export async function warmCatalog(payload: Payload): Promise<void> {
  const started = Date.now();
  try {
    const snapshot = await catalogFor(payload).get();
    payload.logger.info(
      `Индекс каталога собран: ${snapshot.entries.length} позиций за ${Date.now() - started} мс`,
    );
  } catch (error) {
    payload.logger.warn(`Индекс каталога не собрался при старте: ${String(error)}`);
  }
}
