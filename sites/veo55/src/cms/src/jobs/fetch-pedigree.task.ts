import type { TaskConfig } from 'payload';

import { fetchAllPedigrees } from '../lib/dogs/fetch-pedigree';

/**
 * Payload Task: fetch-pedigree — импорт родословной из РКФ для всех Dogs.
 *
 * @remarks
 * Расписание: раз в неделю (вс 04:13). Родословная меняется редко — нет смысла
 * чаще нагружать РКФ-парсер. Заводчик может вручную запустить из админки
 * (например, после добавления нового rkfId Dog'у).
 *
 * Retries: 2 — РКФ-парсер может временно недоступен.
 */
export const FetchPedigreeTask: TaskConfig<'fetch-pedigree'> = {
  slug: 'fetch-pedigree',
  retries: 2,
  outputSchema: [
    { name: 'updated', type: 'number' },
    { name: 'skipped', type: 'number' },
  ],
  schedule: [
    {
      cron: '13 4 * * 0', // воскресенье 04:13 локального времени
      queue: 'pedigree',
    },
  ],
  handler: async ({ req }) => {
    const summary = await fetchAllPedigrees({
      payload: req.payload,
      logger: (m) => req.payload.logger.info(`[task:fetch-pedigree] ${m}`),
    });
    return { output: summary };
  },
};
