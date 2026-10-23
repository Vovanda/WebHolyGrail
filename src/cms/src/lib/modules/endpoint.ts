import type { Endpoint } from 'payload';

import type { ModuleKey } from 'contracts';

import { moduleOn } from './enabled';

/**
 * Ручки модуля отвечают 404, пока модуль выключен.
 *
 * @remarks
 * 404, а не 403: для посетителя выключенного магазина на сайте просто нет -
 * отказ в доступе намекал бы, что он есть, но закрыт.
 */
export function withModuleEndpoints(key: ModuleKey, endpoints: readonly Endpoint[]): Endpoint[] {
  return endpoints.map((e) => ({
    ...e,
    handler: (req) =>
      moduleOn(key) ? e.handler(req) : Response.json({ error: 'not_found' }, { status: 404 }),
  }));
}
