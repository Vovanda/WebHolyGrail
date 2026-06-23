import { NextResponse } from 'next/server';

import { getDogBySlug } from '@/lib/api-client';

/**
 * Same-origin proxy для DogDetailDrawer (client component).
 *
 * Клиент не может ходить напрямую `https://veo.sawking.tech` → `http://localhost:3001`
 * — Chrome Private Network Access блокирует и показывает системный попап
 * «запросить доступ к локальной сети». Прокси через Next-роут той же
 * страницы решает проблему: client → /internal/dog/<slug> (same-origin) →
 * server-side fetch к Payload (CMS_URL) → JSON.
 *
 * Namespace `/internal/*` — отдельный от `/api/*` потому что local-nginx
 * проксирует `/api/*` в Payload CMS:3001 (admin REST). Если запихать
 * client-proxy в `/api/`, тоннель его не пустит.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: 'no-slug' }, { status: 400 });
  const dog = await getDogBySlug(slug).catch(() => null);
  if (!dog) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(dog);
}
