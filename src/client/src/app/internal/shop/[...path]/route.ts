import { NextResponse, type NextRequest } from 'next/server';

import { CMS_URL } from '@/lib/cms-url';
import { forwardedFor } from '@/lib/forwarded-for';

/**
 * Прокси магазина: `/internal/shop/*` → CMS `/api/shop/*` (R15).
 *
 * @remarks
 * Браузер ходит только на свой домен. Пропускаются только известные пути:
 * прокси не должен стать дверью в остальной API CMS. Изменяющий запрос - только
 * со своего Origin и только JSON: чужая страница не оформит заказ от имени
 * посетителя. Секрет заказа (`X-Order-Secret`) и цепочка адресов уходят в CMS
 * как пришли - по адресу CMS считает лимит, по секрету находит заказ.
 *
 * `offers` - позиции корзины по номерам: названия, цены и остатки для показа;
 * с `?q=` - подсказки поиска с добавлением в корзину. `catalog` - страница
 * выдачи каталога: раздел, запрос, фильтр, сортировка, страница.
 */
export const dynamic = 'force-dynamic';

const ROUTES: { re: RegExp; method: 'GET' | 'POST' }[] = [
  { re: /^orders$/, method: 'POST' },
  { re: /^orders\/view$/, method: 'GET' },
  { re: /^orders\/views$/, method: 'POST' },
  { re: /^orders\/cancel$/, method: 'POST' },
  { re: /^invoices\/\d+\/(report|decline)$/, method: 'POST' },
  { re: /^offers$/, method: 'GET' },
  { re: /^catalog$/, method: 'GET' },
];

const BODY_LIMIT = 16 * 1024;

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const allowed = new Set<string>();
  const site = process.env['NEXT_PUBLIC_SITE_URL'];
  if (site) allowed.add(new URL(site).origin);
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  return allowed.has(origin);
}

/** Номера позиций корзины: только целые, не больше сотни. */
function offerIds(request: NextRequest): number[] {
  return [
    ...new Set(
      (request.nextUrl.searchParams.get('ids') ?? '')
        .split(',')
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ].slice(0, 100);
}

async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  const joined = path.join('/');
  const route = ROUTES.find((r) => r.re.test(joined));
  if (!route || route.method !== request.method) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (route.method === 'POST') {
    if (!sameOrigin(request)) return NextResponse.json({ error: 'origin' }, { status: 403 });
    if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) {
      return NextResponse.json({ error: 'content_type' }, { status: 415 });
    }
    if (Number(request.headers.get('content-length') ?? '0') > BODY_LIMIT) {
      return NextResponse.json({ error: 'too_large' }, { status: 413 });
    }
  }

  let target = `${CMS_URL}/api/shop/${joined}`;
  if (joined === 'offers') {
    // Поиск из корзины - по запросу; иначе позиции корзины по номерам.
    const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
    const ids = offerIds(request);
    if (!q && ids.length === 0) return NextResponse.json({ docs: [] });
    target = q
      ? `${CMS_URL}/api/shop/offers?q=${encodeURIComponent(q)}`
      : `${CMS_URL}/api/shop/offers?ids=${ids.join(',')}`;
  }

  if (joined === 'catalog') {
    // Параметры выдачи уходят как есть, но не длиннее разумного: адрес пишет кто угодно.
    const query = request.nextUrl.search.slice(1, 2000);
    target = `${CMS_URL}/api/shop/catalog${query ? `?${query}` : ''}`;
  }

  const secret = request.headers.get('x-order-secret');
  const upstream = await fetch(target, {
    method: route.method,
    headers: {
      ...(route.method === 'POST' ? { 'content-type': 'application/json' } : {}),
      ...(secret ? { 'x-order-secret': secret } : {}),
      ...forwardedFor(request),
    },
    body: route.method === 'POST' ? await request.text() : null,
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  const data: unknown = await upstream.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: upstream.status });
  const retry = upstream.headers.get('retry-after');
  if (retry) response.headers.set('retry-after', retry);
  return response;
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Context) {
  return forward(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: Context) {
  return forward(request, (await params).path);
}
