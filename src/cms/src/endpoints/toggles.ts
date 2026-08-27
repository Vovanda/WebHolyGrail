import type { Endpoint } from 'payload';

import { readToggles } from '../lib/toggles/source';

/**
 * Что на сайте включено.
 *
 * @remarks
 * Отдаёт свод «признак - да или нет» для того окружения, в котором работает
 * приложение. Сайт спрашивает это при отрисовке страницы, поэтому ответ должен
 * быть дешёвым: свод держится в памяти и пересобирается после правок.
 *
 * Открыто всем: секретов здесь нет, признак говорит лишь о том, включена ли
 * возможность. Скрывать это бессмысленно - включённое и так видно на странице.
 */
export const togglesEndpoint: Endpoint = {
  path: '/toggles',
  method: 'get',
  handler: async (req) => {
    const toggles = await readToggles(req.payload);
    return new Response(JSON.stringify({ toggles }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Ответ живёт недолго: переключатель меняют редко, но когда меняют -
        // ждут, что сайт откликнется сразу.
        'cache-control': 'public, max-age=15, stale-while-revalidate=60',
      },
    });
  },
};
