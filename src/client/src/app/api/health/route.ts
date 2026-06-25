/**
 * GET /api/health — runtime info о контейнере client.
 *
 * Что важно:
 *   - `sha` берётся из `process.env.BUILD_SHA` который вшит в image **во время build**
 *     через Dockerfile ARG. То есть это SHA того commit'а, из которого реально
 *     собран этот image — а НЕ commit что триггернул workflow (они могут разойтись
 *     при concurrency rerun / manual deploy).
 *   - `color` приходит из runtime env (compose COLOR=blue|green) — какой цвет сейчас запущен.
 *
 * Не отдаём секреты. Используется как:
 *   - healthcheck endpoint в compose
 *   - smoke check after deploy: `curl https://<your-domain>/api/health | jq .sha`
 *   - debug: which build + which colour is actually live
 */

import os from 'node:os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return Response.json(
    {
      sha: (process.env.BUILD_SHA ?? 'unknown').slice(0, 7),
      fullSha: process.env.BUILD_SHA ?? 'unknown',
      builtAt: process.env.BUILD_TIME ?? 'unknown',
      color: process.env.COLOR ?? 'unknown',
      // os.hostname() = the real container_name (e.g. `${SITE_SLUG}-client-blue|green`).
      // process.env.HOSTNAME = Next bind-address ('0.0.0.0'), misleading.
      hostname: os.hostname(),
      now: new Date().toISOString(),
      ok: true,
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0',
      },
    },
  );
}
