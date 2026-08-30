import { NextResponse } from 'next/server';

/**
 * Манифест со своего домена.
 *
 * @remarks
 * В манифесте стоит путь ключа без домена, а браузер разрешает его от адреса
 * самого манифеста. Возьми плеер файл прямо из раздачи - запрос ключа уйдёт
 * туда же, в хранилище. Поэтому файл остаётся там, где лежит рядом с
 * сегментами, а плеер берёт его отсюда.
 *
 * Сам маршрут ничего не переписывает: содержимое готовит CMS, которая знает
 * и папку записи, и адрес раздачи. Здесь только своя дверь для браузера,
 * как того требует R15.
 */
export const dynamic = 'force-dynamic';

const CMS_URL = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const [id, ...rest] = path;
  if (!id) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const tail = rest.length > 0 ? `/${rest.join('/')}` : '';
  const response = await fetch(`${CMS_URL}/api/video/${id}/manifest${tail}`, {
    cache: 'no-store',
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json({ error: 'not-found' }, { status: response?.status ?? 502 });
  }

  return new Response(await response.text(), {
    status: 200,
    headers: {
      'content-type': 'application/vnd.apple.mpegurl; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}
