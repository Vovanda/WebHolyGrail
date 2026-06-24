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
 *   - smoke-проверка после deploy: `curl https://veo55.ru/api/health | jq .sha`
 *   - debug: какая версия + какой цвет реально на проде
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return Response.json(
    {
      sha: (process.env.BUILD_SHA ?? 'unknown').slice(0, 7),
      fullSha: process.env.BUILD_SHA ?? 'unknown',
      builtAt: process.env.BUILD_TIME ?? 'unknown',
      color: process.env.COLOR ?? 'unknown',
      hostname: process.env.HOSTNAME ?? 'unknown',
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
