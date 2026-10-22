import { NextResponse } from 'next/server';

import { visitorIp } from '@/lib/forwarded-for';

/**
 * `/internal/geo` — город посетителя по IP.
 *
 * Живёт под `/internal`: весь `/api` nginx отдаёт в CMS, и маршрут сайта там
 * не находился.
 *
 * @remarks
 * Нужен, чтобы подборка на главной сразу открывалась на нужном городе. Браузер
 * о местоположении не спрашиваем: запрос разрешения на первом экране отпугивает
 * сильнее, чем помогает точность.
 *
 * Определение — через публичный ip-api. Сервис бесплатный и без ключа, поэтому
 * относимся к нему как к необязательному: любая ошибка, таймаут или локальный
 * адрес дают пустой ответ, а страница показывает город по умолчанию. Ответ
 * кэшируется на сутки — город посетителя за это время не меняется, а лимит
 * бесплатного сервиса тратить незачем.
 */
export const runtime = 'nodejs';

// Локальные и приватные адреса геосервису бесполезны — не ходим зря.
const PRIVATE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd)/i;

function clientIp(request: Request): string | null {
  const ip = visitorIp(request);
  return ip && !PRIVATE.test(ip) ? ip : null;
}

export async function GET(request: Request) {
  const ip = clientIp(request);
  if (!ip) return NextResponse.json({ city: null });

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city&lang=ru`, {
      signal: AbortSignal.timeout(2500),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ city: null });
    const data = (await res.json()) as { status?: string; city?: string };
    return NextResponse.json(
      { city: data.status === 'success' ? (data.city ?? null) : null },
      // Ответ свой у каждого адреса: общий кэш раздал бы один город всем.
      { headers: { 'Cache-Control': 'private, max-age=86400' } },
    );
  } catch {
    return NextResponse.json({ city: null });
  }
}
