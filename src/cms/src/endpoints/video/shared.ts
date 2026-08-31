/**
 * Общее для ручек видео: ответы, куки, идентичность зрителя.
 *
 * @remarks
 * Здесь нет ни одного дела целиком - только то, чем пользуются все ручки разом.
 * Само дело живёт в соседних файлах: каталог, подборки, манифест, доступ, ключ.
 */
import { readViewerToken } from '../../lib/video/viewer-token';
import { tokenFromCookieHeader, VIEWER_COOKIE } from '../../lib/video/viewer-cookie';

export const noStore = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: noStore });

/**
 * Домены, с которых плееру можно просить ключ.
 *
 * @remarks
 * Тот же список, что у Payload для запросов между сайтами: держать два плейлиста
 * значило бы однажды обновить один и забыть второй.
 */
export function allowedOrigins(): ReadonlyArray<string> {
  const fromEnv = (process.env['PAYLOAD_ALLOWED_ORIGINS'] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const own = [
    process.env['PAYLOAD_PUBLIC_SERVER_URL'],
    process.env['NEXT_PUBLIC_SITE_URL'],
  ].filter((value): value is string => Boolean(value));
  return [...own, ...fromEnv, 'http://localhost:3000', 'http://localhost:3001'];
}

/**
 * Чем различаем обратившихся при счёте попыток.
 *
 * @remarks
 * Берём адрес из заголовков обратного прокси, а при их отсутствии - токен
 * зрителя. Точность здесь не нужна: задача - сбить перебор, а не опознать
 * человека.
 */
export function clientKey(req: { headers?: { get(name: string): string | null } }): string {
  const headers = req.headers;
  const forwarded = headers?.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers?.get('x-real-ip')?.trim();
  if (real) return real;
  return tokenFromCookie(req as never) ?? 'unknown';
}

/** Ответ с токеном, который браузер запомнит. */
export function jsonWithToken(
  body: Record<string, unknown>,
  token: string,
  expires: number,
): Response {
  const maxAge = Math.max(0, expires - nowSeconds());
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...noStore,
      // Скриптам кука недоступна: плеер её не читает, браузер прикладывает сам.
      // Так токен не появляется ни в адресах, ни в логах, ни в досягаемости
      // чужого кода на странице.
      'Set-Cookie': `${VIEWER_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`,
    },
  });
}

/** Токен, уже выданный этому браузеру. */
export function tokenFromCookie(req: { headers?: Headers }): string | null {
  return tokenFromCookieHeader(req.headers?.get('cookie') ?? '');
}

/** Секрет приложения — тот же, что у остальной авторизации. */
export function appSecret(): string {
  const secret = process.env['PAYLOAD_SECRET'];
  if (!secret) throw new Error('Не задан PAYLOAD_SECRET — нечем подписывать токен зрителя.');
  return secret;
}

export const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/**
 * Идентичность из токена, лежащего в куке этого браузера.
 *
 * @remarks
 * Права находятся по опознанию, и знать его нужно везде, где решается доступ,
 * а не только при выдаче ключа. Иначе список канала считал бы закрытым то,
 * что у того же зрителя открыто, - замок на карточке горел бы над играющим
 * видео.
 *
 * Просроченный или испорченный токен идентичности не даёт: подпись не сошлась -
 * значит зритель неизвестен, а не «какой-нибудь».
 */
export function markerFromCookie(req: { headers?: Headers }): string | undefined {
  const saved = tokenFromCookie(req);
  if (!saved) return undefined;
  const checked = readViewerToken(saved, appSecret(), nowSeconds());
  return checked.ok ? checked.visitorMarker : undefined;
}

/**
 * Кто смотрит: учётная запись, идентичность и владение этим видео.
 *
 * @remarks
 * Владение решает доступ к закрытому наравне с покупкой, поэтому собирается
 * в одном месте — иначе один эндпоинт учитывал бы его, а соседний молча нет.
 *
 * Роли администратора здесь нет: для чужого платного материала он посторонний.
 */
export function viewerOf(
  req: { user?: { id?: string | number } | null; headers?: Headers },
  uploadedBy: unknown,
): {
  userId: string | number | null;
  ownsVideo: boolean;
  visitorMarker?: string | undefined;
} {
  const userId = req.user?.id ?? null;
  // Автор приходит номером при depth=0 и документом при depth=1 — сверяем оба вида.
  const ownerId =
    typeof uploadedBy === 'object' && uploadedBy
      ? ((uploadedBy as { id?: string | number }).id ?? null)
      : ((uploadedBy as string | number | null) ?? null);

  return {
    userId,
    ownsVideo: userId !== null && ownerId !== null && String(ownerId) === String(userId),
    visitorMarker: markerFromCookie(req),
  };
}
