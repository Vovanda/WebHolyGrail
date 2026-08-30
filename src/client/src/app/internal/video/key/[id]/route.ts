import { NextResponse } from 'next/server';

/**
 * Ключ отрезка со своего же домена.
 *
 * @remarks
 * В манифесте стоит путь на эту дверь, а не на CMS: идентичность живёт кукой
 * на домене сайта, и на чужой домен она не поедет. Отсюда же запрос идёт
 * в CMS сервером.
 *
 * Номер криптопериода передаётся как есть: по нему выдача выводит ключ.
 */
export const dynamic = 'force-dynamic';

const CMS_URL = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const period = new URL(request.url).searchParams.get('p');
  const cookie = request.headers.get('cookie') ?? '';
  /*
    Откуда пришёл браузер - решает выдача, а не мы. Прежде здесь всегда
    подставлялся свой адрес, и проверка «пришли ли со своего сайта» пропускала
    любого: чужая страница, встроившая поток, получала ключ наравне со своей.

    Своё происхождение подставляем только когда браузер не прислал ничего:
    при переходе по адресу заголовка нет, и отказывать тут не за что.
  */
  const origin = request.headers.get('origin') ?? new URL(request.url).origin;

  const target = new URL(`${CMS_URL}/api/video/${encodeURIComponent(id)}/key`);
  if (period !== null) target.searchParams.set('p', period);

  const response = await fetch(target, {
    cache: 'no-store',
    headers: {
      ...(cookie ? { cookie } : {}),
      origin,
    },
  }).catch(() => null);

  if (!response) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  // Отказ приходит разбором, ключ - байтами. Пропускаем и то, и другое как
  // есть: разбирать причину умеет сам плеер.
  const body = await response.arrayBuffer();

  // Сколько ждать после отказа по частоте - знает выдача, и сказать это надо
  // тому, кто спрашивал. Без заголовка плеер видит только «слишком часто»
  // и не понимает, через сколько повторять.
  const retryAfter = response.headers.get('retry-after');

  return new Response(body, {
    status: response.status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
      ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
    },
  });
}
