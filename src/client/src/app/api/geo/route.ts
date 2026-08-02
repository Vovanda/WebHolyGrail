import { NextResponse } from 'next/server';

/**
 * `/api/geo` — город посетителя по IP.
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

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  if (!ip) return null;
  // Локальные и приватные адреса геосервису бесполезны — не ходим зря.
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd)/i.test(ip)) return null;
  return ip;
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
      { headers: { 'Cache-Control': 'public, max-age=86400' } },
    );
  } catch {
    return NextResponse.json({ city: null });
  }
}
