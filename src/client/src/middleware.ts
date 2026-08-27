import { NextResponse, type NextRequest } from 'next/server';

import { PATHNAME_HEADER } from '@/lib/pathname-header';

/**
 * Адрес страницы для серверной раскладки.
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
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|media/|internal/).*)'],
};
