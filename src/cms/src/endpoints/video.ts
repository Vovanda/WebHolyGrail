import type { Endpoint } from 'payload';

import { signedInPolicy } from '../lib/video/access-policy';
import { issueViewerToken } from '../lib/video/envelope';
import { grantStreamAccess, type StreamRecord } from '../lib/video/grant-access';

/**
 * Эндпоинты видео: токен зрителя и конверт с секретом потока.
 *
 * @remarks
 * Токен выдаёт CMS, а не фронт: подписывается он секретом приложения, и знать
 * этот секрет фронту незачем. Страница при рендере забирает токен себе и
 * кладёт в разметку плеера.
 *
 * Оба ответа помечены как некешируемые. Для конверта это обязательно: он
 * персональный, и попав в общий кеш CDN достался бы следующему зрителю.
 */

const noStore = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: noStore });

/** Секрет приложения — тот же, что у остальной авторизации. */
function appSecret(): string {
  const secret = process.env['PAYLOAD_SECRET'];
  if (!secret) throw new Error('Не задан PAYLOAD_SECRET — нечем подписывать токен зрителя.');
  return secret;
}

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/**
 * Отдаёт ролик по адресу канала и короткому коду.
 *
 * @remarks
 * Отдельным эндпоинтом, а не запросом к `media` с фильтром: чтение участников
 * закрыто для посторонних, поэтому в обычной выдаче автор приходит номером и
 * сверить адрес канала нечем.
 *
 * Наружу уходит только то, что нужно странице. Ни секрета, ни почты автора,
 * ни прочего содержимого учётной записи здесь нет.
 */
export const videoByCodeEndpoint: Endpoint = {
  path: '/video/by-code/:channel/:code',
  method: 'get',
  handler: async (req) => {
    const channel = String(req.routeParams?.['channel'] ?? '');
    const code = String(req.routeParams?.['code'] ?? '');
    if (!channel || !code) return json({ error: 'Не указан адрес.' }, 400);

    const found = await req.payload.find({
      collection: 'media',
      where: { shortCode: { equals: code } },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0] as
      | {
          id: string | number;
          alt?: string;
          caption?: string;
          filename?: string;
          access?: string;
          uploadedBy?: { channel?: string; name?: string } | string | number | null;
          preview?: { url?: string; alt?: string } | null;
          hls?: {
            status?: string;
            playlistUrl?: string | null;
            qualities?: ReadonlyArray<{ height?: number | null }> | null;
            durationSeconds?: number | null;
            deletedAt?: string | null;
          } | null;
        }
      | undefined;

    if (!doc || doc.hls?.deletedAt) return json({ error: 'not-found' }, 404);

    // Адрес должен совпасть целиком: код уникален сам по себе, но без сверки
    // канала один ролик открывался бы с любым именем в ссылке, и поисковик
    // видел бы десяток дублей одной страницы.
    const owner = typeof doc.uploadedBy === 'object' && doc.uploadedBy ? doc.uploadedBy : null;
    if ((owner?.channel ?? '') !== channel) return json({ error: 'not-found' }, 404);

    return json({
      id: doc.id,
      channel,
      authorName: owner?.name ?? null,
      title: doc.caption?.trim() || doc.alt?.trim() || doc.filename || 'Видео',
      description: doc.alt?.trim() || null,
      access: doc.access === 'private' ? 'private' : 'public',
      status: doc.hls?.status ?? 'pending',
      playlistUrl: doc.hls?.playlistUrl ?? '',
      qualities: (doc.hls?.qualities ?? []).flatMap((q) => (q?.height ? [q.height] : [])),
      durationSeconds: doc.hls?.durationSeconds ?? null,
      poster: doc.preview?.url ?? null,
    });
  },
};

/**
 * Говорит, откроется ли ролик у этого зрителя.
 *
 * @remarks
 * Нужен странице: она решает, рисовать плеер или заглушку, ещё до того как
 * браузер что-то загрузит. Без этого закрытый ролик показывал бы обычный
 * плеер, а отказ всплывал только по нажатию «play» — то есть выглядел бы
 * поломкой, а не закрытым доступом.
 *
 * Секрета в ответе нет: только решение и его причина.
 */
export const videoAccessEndpoint: Endpoint = {
  path: '/video/:id/access',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан ролик.' }, 400);

    const doc = (await req.payload.findByID({
      collection: 'media',
      id: String(id),
      depth: 0,
      overrideAccess: true,
    })) as {
      id: string | number;
      access?: string;
      hls?: { status?: string; deletedAt?: string | null };
    };

    if (doc.hls?.deletedAt) {
      return json({ allowed: false, reason: 'not-found', status: 'deleted' });
    }

    const decision = await signedInPolicy.decide(
      { id: doc.id, access: doc.access === 'private' ? 'private' : 'public' },
      { userId: req.user?.id ?? null },
    );

    return json({
      allowed: decision.allowed,
      reason: decision.allowed ? null : decision.reason,
      status: doc.hls?.status ?? 'pending',
    });
  },
};

/**
 * Выдаёт токен зрителя.
 *
 * @remarks
 * Открыт для всех, включая не вошедших: сам по себе токен ничего не открывает,
 * он лишь адресует конверт конкретной сессии. Право смотреть проверяется
 * отдельно, при выдаче конверта.
 */
export const videoTokenEndpoint: Endpoint = {
  path: '/video/token',
  method: 'post',
  handler: () => {
    const token = issueViewerToken(appSecret(), nowSeconds());
    // Наружу уходит только строка токена; ключ конверта живёт внутри неё и
    // отдельно нигде не хранится.
    return json({ token: token.value });
  },
};

/**
 * Отдаёт конверт с секретом потока.
 *
 * @remarks
 * Отказ возвращается кодом 403 с причиной, а не пустым телом: плееру нужно
 * отличать «войди» от «видео ещё готовится», чтобы показать нужную заглушку
 * вместо чёрного квадрата.
 */
export const videoEnvelopeEndpoint: Endpoint = {
  path: '/video/:id/envelope',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан ролик.' }, 400);

    const token = new URL(req.url ?? '', 'http://localhost').searchParams.get('token') ?? '';

    const doc = (await req.payload.findByID({
      collection: 'media',
      id: String(id),
      depth: 0,
      // Секрет закрыт для чтения через API — здесь он нужен по существу,
      // поэтому берём его в обход доступа и наружу не отдаём.
      overrideAccess: true,
    })) as {
      id: string | number;
      access?: string;
      hls?: { status?: string; secret?: string | null; deletedAt?: string | null };
    };

    // Помеченный к удалению не играет: файлы ещё лежат, и без этой проверки
    // прямая ссылка продолжала бы показывать то, что владелец убрал.
    if (doc.hls?.deletedAt) return json({ error: 'not-found' }, 404);

    const video: StreamRecord = {
      id: doc.id,
      access: doc.access === 'private' ? 'private' : 'public',
      status: (doc.hls?.status as StreamRecord['status']) ?? 'pending',
      secret: doc.hls?.secret ?? null,
    };

    const result = await grantStreamAccess({
      video,
      viewer: { userId: req.user?.id ?? null },
      token,
      policy: signedInPolicy,
      appSecret: appSecret(),
      nowSeconds: nowSeconds(),
    });

    if (!result.ok) {
      const status = result.reason === 'not-ready' ? 409 : 403;
      return json({ error: result.reason }, status);
    }

    return json({ envelope: result.envelope });
  },
};
