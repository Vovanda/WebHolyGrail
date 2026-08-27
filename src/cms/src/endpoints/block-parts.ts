import type { Endpoint } from 'payload';

import { collectBlockParts } from '../lib/block-parts';

/**
 * Из чего состоит блок.
 *
 * @remarks
 * Спрашивает админка, когда владелец хочет увидеть, до чего внутри блока может
 * дотянуться своим стилем. Глубину задаёт он же: на первом уровне видно
 * устройство самого блока, глубже - начинку вложенных компонентов.
 *
 * Только для тех, кто вошёл: состав блоков - не секрет, но и наружу его
 * показывать незачем.
 */
export const blockPartsEndpoint: Endpoint = {
  path: '/block-parts',
  method: 'get',
  handler: (req) => {
    if (!req.user) {
      return new Response(JSON.stringify({ error: 'Нужно войти' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const params = new URL(req.url ?? '', 'http://localhost').searchParams;
    const blockType = params.get('blockType') ?? '';
    const depth = Math.min(10, Math.max(0, Number(params.get('depth') ?? 2)));

    if (!blockType) {
      return new Response(JSON.stringify({ error: 'Не сказано, какой блок' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    return new Response(JSON.stringify({ parts: collectBlockParts(blockType, depth) }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  },
};
