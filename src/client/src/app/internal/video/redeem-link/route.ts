import { NextResponse } from 'next/server';

/**
 * Приём ссылки-приглашения со своего же домена.
 *
 * @remarks
 * Нужен по той же причине, что и приём кода (R15): браузер не ходит в CMS
 * напрямую — с https-страницы такой запрос упирается в проверку доступа
 * к локальной сети, а на проде адрес CMS известен только контейнеру.
 *
 * Куки зрителя пробрасываются: у вошедшего право дополнительно закрепляется
 * за учётной записью, и без куки CMS увидит анонима.
 */
export const dynamic = 'force-dynamic';

const CMS_URL = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const cookie = request.headers.get('cookie') ?? '';

  const response = await fetch(`${CMS_URL}/api/video/redeem-link`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body,
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const result = NextResponse.json(data, { status: response.status });

  // Токен с новым правом запоминаем в браузере: иначе оно живёт до первой же
  // перезагрузки, и зритель на странице подборки снова упрётся в замок.
  const savedToken = response.headers.get('set-cookie');
  if (savedToken) result.headers.set('set-cookie', savedToken);

  return result;
}
