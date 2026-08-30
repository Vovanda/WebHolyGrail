import { NextResponse } from 'next/server';

/**
 * Идентичность зрителя со своего же домена.
 *
 * @remarks
 * Токен носит идентичность, по которому находятся права, и живёт в куке, закрытой
 * от скриптов. Поставить такую куку может только ответ сервера, а серверная
 * страница этого не умеет - отсюда отдельный маршрут.
 *
 * На своём домене, а не прямым запросом в CMS (R15): кука ставится на тот
 * домен, который отвечает, и с чужого до браузера бы не доехала.
 *
 * Зовёт его загрузчик ключа, когда выдача отвечает, что идентичности нет: у того,
 * кто пришёл впервые и ещё не вводил код, куки не было вовсе.
 */
export const dynamic = 'force-dynamic';

const CMS_URL = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';

export async function POST(request: Request): Promise<NextResponse> {
  const cookie = request.headers.get('cookie') ?? '';

  const response = await fetch(`${CMS_URL}/api/video/token`, {
    method: 'POST',
    cache: 'no-store',
    headers: cookie ? { cookie } : {},
  }).catch(() => null);

  if (!response) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const result = NextResponse.json({ ok: response.ok }, { status: response.status });

  // Сам токен наружу не отдаём - только куку: страница его больше не читает,
  // и в разметке ему делать нечего.
  const saved = response.headers.get('set-cookie');
  if (saved) result.headers.set('set-cookie', saved);

  return result;
}
