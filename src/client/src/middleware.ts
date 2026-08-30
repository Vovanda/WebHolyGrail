import { NextResponse, type NextRequest } from 'next/server';

import { PATHNAME_HEADER, SEARCH_HEADER } from '@/lib/pathname-header';

/**
 * Адрес страницы для серверной раскладки и маркер посетителя.
 *
 * @remarks
 * Раскладка собирается в корневом layout, а он о запрошенном адресе ничего не
 * знает: у серверных частей Next его нет. Поэтому кладём путь в заголовок, и
 * раскладка решает, какие панели показать на этой странице.
 *
 * Заголовок внутренний, наружу не уходит: он добавляется к запросу, а не к
 * ответу браузеру.
 *
 * Служебные пути пропускаем мимо: разбирать адрес картинки или сборки незачем,
 * а лишняя работа на каждом файле складывается в заметную.
 */

/** Кука с маркером посетителя; имя то же, что у выдачи в CMS. */
const VIEWER_COOKIE = 'whg-viewer';

const CMS_URL = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';

export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
  headers.set(SEARCH_HEADER, request.nextUrl.search);

  const response = NextResponse.next({ request: { headers } });

  /*
    Маркер выдаётся вместе со страницей, а не по промаху.

    Плеер спрашивает ключ на каждое качество, и без маркера каждый такой запрос
    получал отказ, шёл за токеном и повторялся - до первого кадра набегала
    задержка, видная глазом. Здесь маркер уже есть к моменту первого запроса.
  */
  if (!request.cookies.has(VIEWER_COOKIE) && CMS_URL) {
    const issued = await fetch(`${CMS_URL}/api/video/token`, {
      method: 'POST',
      cache: 'no-store',
    }).catch(() => null);

    const saved = issued?.headers.get('set-cookie');
    // Выдача не ответила - не беда: загрузчик ключа заведёт маркер сам,
    // как делал раньше. Страницу из-за этого не задерживаем.
    if (saved) response.headers.set('set-cookie', saved);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|media/|internal/).*)'],
};
