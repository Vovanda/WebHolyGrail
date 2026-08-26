import type { Endpoint } from 'payload';

import { payloadEntitlements } from '../lib/video/entitlement-source';
import { entitlementPolicy } from '../lib/video/entitlements';
import { issueViewerToken } from '../lib/video/envelope';
import { grantStreamAccess, type StreamRecord } from '../lib/video/grant-access';
import { masterKey, unwrapSecret } from '../lib/video/key-vault';

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
 * Кто смотрит: учётная запись и владение этим роликом.
 *
 * @remarks
 * Владение решает доступ к закрытому наравне с покупкой, поэтому собирается
 * в одном месте — иначе один эндпоинт учитывал бы его, а соседний молча нет.
 *
 * Роли администратора здесь нет: для чужого платного материала он посторонний.
 */
function viewerOf(
  req: { user?: { id?: string | number } | null },
  uploadedBy: unknown,
): {
  userId: string | number | null;
  ownsVideo: boolean;
  grantedPlaylists?: ReadonlyArray<string | number>;
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
  };
}

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
 * Отдаёт канал: сведения об авторе и его ролики.
 *
 * @remarks
 * Тем же эндпоинтом, а не запросом к медиа с фильтром: чтение участников
 * закрыто для посторонних, и снаружи по автору не отфильтровать.
 *
 * Закрытые ролики в список не попадают. Показывать их с замком заманчиво —
 * это витрина платного, — но канал открыт всем, включая поисковик, и список
 * закрытого превратился бы в опись платного для тех, кто его не покупал.
 */
export const videoChannelEndpoint: Endpoint = {
  path: '/video/channel/:channel',
  method: 'get',
  handler: async (req) => {
    const channel = String(req.routeParams?.['channel'] ?? '');
    if (!channel) return json({ error: 'Не указан канал.' }, 400);

    const owners = await req.payload.find({
      collection: 'users',
      where: { channel: { equals: channel } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });
    const owner = owners.docs[0] as { id: string | number; name?: string } | undefined;
    if (!owner) return json({ error: 'not-found' }, 404);

    const videos = await req.payload.find({
      collection: 'media',
      where: {
        and: [
          { uploadedBy: { equals: owner.id } },
          { 'hls.status': { equals: 'ready' } },
          { access: { equals: 'public' } },
        ],
      },
      sort: '-createdAt',
      depth: 1,
      limit: 60,
      overrideAccess: true,
    });

    return json({
      channel,
      authorName: owner.name ?? null,
      videos: videos.docs.flatMap((raw) => {
        const doc = raw as {
          id: string | number;
          caption?: string;
          alt?: string;
          filename?: string;
          shortCode?: string | null;
          createdAt?: string;
          preview?: { url?: string } | null;
          hls?: { durationSeconds?: number | null; deletedAt?: string | null } | null;
        };
        if (!doc.shortCode || doc.hls?.deletedAt) return [];
        return [
          {
            code: doc.shortCode,
            title: doc.caption?.trim() || doc.alt?.trim() || doc.filename || 'Видео',
            poster: doc.preview?.url ?? null,
            durationSeconds: doc.hls?.durationSeconds ?? null,
            createdAt: doc.createdAt ?? null,
          },
        ];
      }),
    });
  },
};

/** Ролик набора в том виде, в каком он приходит из связи. */
type PlaylistVideo = {
  id: string | number;
  alt?: string;
  caption?: string;
  filename?: string;
  shortCode?: string | null;
  access?: string;
  preview?: { url?: string } | null;
  hls?: { status?: string; durationSeconds?: number | null; deletedAt?: string | null } | null;
};

/**
 * Отдаёт набор: сведения о нём и его ролики по порядку.
 *
 * @remarks
 * Закрытые ролики, в отличие от канала, из списка не убираются: набор и есть
 * витрина, а его состав — продающая часть. Наружу от закрытого ролика уходит
 * только название и обложка; играть он не начнёт, конверт выдаётся отдельно
 * и по тем же правилам.
 *
 * Замок считается по зрителю: куки страница пробрасывает, поэтому у вошедшего
 * с правом на набор ролики открыты, а у постороннего закрыты.
 */
export const videoPlaylistEndpoint: Endpoint = {
  path: '/video/playlist/:channel/:code',
  method: 'get',
  handler: async (req) => {
    const channel = String(req.routeParams?.['channel'] ?? '');
    const code = String(req.routeParams?.['code'] ?? '');
    if (!channel || !code) return json({ error: 'Не указан адрес.' }, 400);

    const found = await req.payload.find({
      collection: 'playlists',
      where: { shortCode: { equals: code } },
      depth: 2,
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0] as
      | {
          id: string | number;
          title?: string;
          description?: string | null;
          cover?: { url?: string } | null;
          author?:
            | { id?: string | number; channel?: string; name?: string }
            | string
            | number
            | null;
          items?: ReadonlyArray<{ video?: PlaylistVideo | string | number | null }> | null;
        }
      | undefined;
    if (!doc) return json({ error: 'not-found' }, 404);

    // Адрес сверяется целиком, как у ролика: иначе один набор открывался бы с
    // любым каналом в ссылке и поисковик видел бы дубли одной страницы.
    const author = typeof doc.author === 'object' && doc.author ? doc.author : null;
    if ((author?.channel ?? '') !== channel) return json({ error: 'not-found' }, 404);

    const policy = entitlementPolicy(payloadEntitlements(req.payload));
    const viewer = { userId: req.user?.id ?? null };

    const items = [];
    for (const entry of doc.items ?? []) {
      const video = typeof entry?.video === 'object' && entry.video ? entry.video : null;
      // Помеченный к удалению из набора пропадает сразу, как и с сайта.
      if (!video || !video.shortCode || video.hls?.deletedAt) continue;

      const access = video.access === 'private' ? 'private' : 'public';
      const decision = await policy.decide({ id: video.id, access }, viewer);

      items.push({
        code: video.shortCode,
        title: video.caption?.trim() || video.alt?.trim() || video.filename || 'Видео',
        poster: video.preview?.url ?? null,
        durationSeconds: video.hls?.durationSeconds ?? null,
        ready: video.hls?.status === 'ready',
        locked: !decision.allowed,
        lockReason: decision.allowed ? null : decision.reason,
      });
    }

    return json({
      code,
      channel,
      authorName: author?.name ?? null,
      title: doc.title ?? 'Набор',
      description: doc.description ?? null,
      // Своя обложка набора важнее, но если её не выбрали — берём кадр первого
      // ролика. Пустое место на витрине выглядит недоделкой, а кадр у ролика
      // и так снят при нарезке.
      //
      // Подставляется при выдаче, а не пишется в базу: иначе автоподстановка
      // однажды затрёт обложку, которую владелец выбрал руками.
      cover: doc.cover?.url ?? items.find((item) => item.poster)?.poster ?? null,
      items,
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
      uploadedBy?: unknown;
      hls?: { status?: string; deletedAt?: string | null };
    };

    if (doc.hls?.deletedAt) {
      return json({ allowed: false, reason: 'not-found', status: 'deleted' });
    }

    const decision = await entitlementPolicy(payloadEntitlements(req.payload)).decide(
      { id: doc.id, access: doc.access === 'private' ? 'private' : 'public' },
      viewerOf(req, doc.uploadedBy),
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
      uploadedBy?: unknown;
      hls?: { status?: string; secret?: string | null; deletedAt?: string | null };
    };

    // Помеченный к удалению не играет: файлы ещё лежат, и без этой проверки
    // прямая ссылка продолжала бы показывать то, что владелец убрал.
    if (doc.hls?.deletedAt) return json({ error: 'not-found' }, 404);

    // Секрет лежит в базе завёрнутым в мастер-ключ — разворачиваем перед тем,
    // как запечатать его в конверт зрителя. Ролики, залитые до включения ключа,
    // читаются как есть.
    const stored = doc.hls?.secret ?? null;
    const video: StreamRecord = {
      id: doc.id,
      access: doc.access === 'private' ? 'private' : 'public',
      status: (doc.hls?.status as StreamRecord['status']) ?? 'pending',
      secret: stored ? unwrapSecret(stored, masterKey()).toString('base64') : null,
    };

    const result = await grantStreamAccess({
      video,
      viewer: viewerOf(req, doc.uploadedBy),
      token,
      policy: entitlementPolicy(payloadEntitlements(req.payload)),
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
