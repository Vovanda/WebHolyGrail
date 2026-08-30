import type { Endpoint } from 'payload';

import { accessContents, payloadEntitlements } from '../lib/video/entitlement-source';
import { entitlementPolicy } from '../lib/video/entitlements';
import { checkKeyRateShared } from '../lib/video/key-rate-store';
import { rewriteManifest } from '../lib/video/manifest';
import { checkRequestOrigin } from '../lib/video/request-origin';
import {
  checkRedeemAttempt,
  forgetRedeemMisses,
  noteRedeemMiss,
} from '../lib/video/redeem-throttle';
import { issueViewerToken, readViewerToken, withExtendedLife } from '../lib/video/viewer-token';
import { playlistCovers } from '../lib/video/playlist-covers';
import { writeEntitlement } from '../lib/video/write-entitlement';
import { grantStreamAccess, type StreamRecord } from '../lib/video/grant-access';
import { masterKey, unwrapSecret } from '../lib/video/key-vault';
import { keyForPeriod } from '../lib/video/crypto-period';
import { noteKeyRequest } from '../lib/video/shared-access';
import { acceptLink } from '../lib/video/accept-link';
import { normalizeAccessCode } from '../lib/video/access-code';
import { looksLikeLinkToken } from '../lib/video/link-token';
import { resourceAddress } from '../lib/video/resource-address';
import { redeemCode } from '../lib/video/redeem';
import { tokenFromCookieHeader, VIEWER_COOKIE } from '../lib/video/viewer-cookie';
import { hasWayIn } from '../lib/video/way-in';

/**
 * Эндпоинты видео: идентичность зрителя и ключ криптопериода.
 *
 * @remarks
 * Токен выдаёт CMS, а не фронт: подписывается он секретом приложения, и знать
 * этот секрет фронту незачем. Страница при рендере забирает токен себе и
 * кладёт в разметку плеера.
 *
 * Оба ответа помечены как некешируемые. Для ключа это обязательно: он
 * персональный, и попав в общий кеш CDN достался бы следующему зрителю.
 */

const noStore = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: noStore });

/**
 * Домены, с которых плееру можно просить ключ.
 *
 * @remarks
 * Тот же список, что у Payload для запросов между сайтами: держать два плейлиста
 * значило бы однажды обновить один и забыть второй.
 */
function allowedOrigins(): ReadonlyArray<string> {
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
function clientKey(req: { headers?: { get(name: string): string | null } }): string {
  const headers = req.headers;
  const forwarded = headers?.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers?.get('x-real-ip')?.trim();
  if (real) return real;
  return tokenFromCookie(req as never) ?? 'unknown';
}

/** Ответ с токеном, который браузер запомнит. */
function jsonWithToken(body: Record<string, unknown>, token: string, expires: number): Response {
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
function tokenFromCookie(req: { headers?: Headers }): string | null {
  return tokenFromCookieHeader(req.headers?.get('cookie') ?? '');
}

/** Секрет приложения — тот же, что у остальной авторизации. */
function appSecret(): string {
  const secret = process.env['PAYLOAD_SECRET'];
  if (!secret) throw new Error('Не задан PAYLOAD_SECRET — нечем подписывать токен зрителя.');
  return secret;
}

const nowSeconds = (): number => Math.floor(Date.now() / 1000);

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
function markerFromCookie(req: { headers?: Headers }): string | undefined {
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
function viewerOf(
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

/**
 * Отдаёт видео по адресу канала и короткому коду.
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
          description?: string;
          caption?: string;
          filename?: string;
          access?: string;
          uploadedBy?: { channel?: string; name?: string } | string | number | null;
          preview?: { url?: string; alt?: string } | null;
          chapters?: ReadonlyArray<{ startSeconds?: number; title?: string }> | null;
          subtitles?: ReadonlyArray<{
            language?: string;
            label?: string;
            default?: boolean;
            file?: { url?: string } | string | number | null;
          }> | null;
          hls?: {
            storyboard?: {
              url?: string;
              columns?: number;
              rows?: number;
              count?: number;
              frameWidth?: number;
              frameHeight?: number;
              intervalSeconds?: number;
            } | null;
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
    // канала один видео открывался бы с любым именем в ссылке, и поисковик
    // видел бы десяток дублей одной страницы.
    const owner = typeof doc.uploadedBy === 'object' && doc.uploadedBy ? doc.uploadedBy : null;
    if ((owner?.channel ?? '') !== channel) return json({ error: 'not-found' }, 404);

    /*
      В какие плейлисты входит это видео.

      Зритель приходит и со страницы канала, и по прямой ссылке - тогда плейлиста
      рядом нет, и после просмотра идти некуда. Список плейлистов даёт следующий
      шаг: видно, что видео часть серии, и куда за остальным.

      Скрытые подборки отсюда не показываем - тем же правилом, что и на канале:
      страница открыта всем, включая поисковик, а скрытая подборка на то
      и скрытая, чтобы находиться по ссылке, а не по перечням.

      Закрытость здесь ни при чём: закрытая, но опубликованная подборка -
      это витрина платного, и её как раз показать надо.
    */
    const sets = await req.payload.find({
      collection: 'playlists',
      where: {
        and: [{ 'items.video': { equals: doc.id } }, { visibility: { equals: 'published' } }],
      },
      // Глубже на шаг: нужны кадры самих видео - из них собирается обложка
      // плейлисту, у которого своей нет.
      depth: 2,
      limit: 12,
      overrideAccess: true,
    });

    /*
      Есть ли чем открыть эту запись прямо сейчас. Нужно странице: форма ввода
      кода имеет смысл, только когда живой код или ссылка существуют. Иначе
      человеку показывают поле, в которое нечего ввести.

      Спрашиваем только про закрытое: у открытой записи формы нет в любом случае,
      и лишний поход в базу ни к чему. Право самого зрителя здесь не смотрим -
      его решает политика при рендере страницы, а этот признак про запись.
    */
    const openableByCode =
      doc.access === 'private' ? await hasWayIn(req.payload, { kind: 'media', id: doc.id }) : false;

    return json({
      id: doc.id,
      channel,
      openableByCode,
      authorName: owner?.name ?? null,
      sets: sets.docs.map((set) => {
        const item = set as {
          id: string | number;
          title?: string;
          shortCode?: string;
          cover?: { url?: string } | null;
          items?: unknown[];
        };
        return {
          id: item.id,
          code: item.shortCode ?? null,
          title: item.title?.trim() || 'Плейлист',
          count: item.items?.length ?? 0,
          cover: item.cover?.url ?? null,
          covers: playlistCovers(item.items ?? []),
        };
      }),
      // Имя файла в запасные заголовки не берётся: у нарезанного видео оно
      // показывает имя пакета в хранилище, а не название для человека.
      title: doc.caption?.trim() || doc.alt?.trim() || 'Видео',
      // Описание берётся у записи, а alt остаётся запасным: он играл эту роль
      // до появления своего поля, и у прежних записей текст лежит там.
      description: doc.description?.trim() || doc.alt?.trim() || null,
      access: doc.access === 'private' ? 'private' : 'public',
      status: doc.hls?.status ?? 'pending',
      playlistUrl: doc.hls?.playlistUrl ?? '',
      qualities: (doc.hls?.qualities ?? []).flatMap((q) => (q?.height ? [q.height] : [])),
      durationSeconds: doc.hls?.durationSeconds ?? null,
      poster: doc.preview?.url ?? null,
      // Лента кадров для перемотки, если её сняли.
      storyboard: doc.hls?.storyboard?.url
        ? {
            url: doc.hls.storyboard.url,
            columns: doc.hls.storyboard.columns ?? 1,
            rows: doc.hls.storyboard.rows ?? 1,
            count: doc.hls.storyboard.count ?? 1,
            frameWidth: doc.hls.storyboard.frameWidth ?? 160,
            frameHeight: doc.hls.storyboard.frameHeight ?? 90,
            intervalSeconds: doc.hls.storyboard.intervalSeconds ?? 5,
          }
        : null,
      // Оглавление: только главы с названием и временем, по возрастанию.
      // Порядок в админке зависит от того, как их вводили, а плееру нужен ряд.
      chapters: (doc.chapters ?? [])
        .flatMap((chapter) =>
          typeof chapter?.startSeconds === 'number' && chapter?.title?.trim()
            ? [{ startSeconds: chapter.startSeconds, title: chapter.title.trim() }]
            : [],
        )
        .sort((a, b) => a.startSeconds - b.startSeconds),
      // Дорожки субтитров: файл, язык и подпись. Без файла дорожка бесполезна,
      // такие пропускаем.
      subtitles: (doc.subtitles ?? []).flatMap((track) => {
        const file = track?.file;
        const src = typeof file === 'object' && file ? file.url : null;
        if (!src || !track?.language) return [];
        return [
          {
            language: track.language,
            label: track.label?.trim() || track.language,
            src,
            default: track.default === true,
          },
        ];
      }),
    });
  },
};

/**
 * Отдаёт канал: сведения об авторе и его видео.
 *
 * @remarks
 * Тем же эндпоинтом, а не запросом к медиа с фильтром: чтение участников
 * закрыто для посторонних, и снаружи по автору не отфильтровать.
 *
 * Что показать, решает публикация, а не доступ: это две независимые оси.
 * Закрытое опубликованное стоит в витрине с замком - иначе платное негде
 * увидеть и незачем покупать. Открытое скрытое раздаётся ссылкой и в списки
 * не идёт. Скрытое не показывается вовсе, чем бы ни был его доступ.
 *
 * Раньше витрина собиралась из всего открытого и нарезанного, то есть из всего
 * залитого: попадание туда равнялось факту загрузки, а платная запись успевала
 * побывать на виду в промежутке между нарезкой и переключением доступа.
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
          // Доступ здесь не спрашивается намеренно: закрытое опубликованное
          // и есть витрина платного. Играть оно не станет - ключ выдаётся
          // отдельно и по праву, - но увидеть его можно.
          { visibility: { equals: 'published' } },
        ],
      },
      sort: '-createdAt',
      depth: 1,
      limit: 60,
      overrideAccess: true,
    });

    /*
      Плейлисты автора. Показываем открытые: канал видит любой, включая поисковик,
      и перечень закрытого стал бы описью платного для тех, кто его не брал -
      тем же правилом, что и для отдельного видео.
    */
    const sets = await req.payload.find({
      collection: 'playlists',
      where: {
        /*
          Раньше здесь стояло «доступ не закрытый», но закрытого у подборки нет:
          у неё «открыта» и «не в списках, только по ссылке». Условие пропускало
          обе, и подборка, спрятанная от списков, всё равно стояла на канале.
        */
        and: [{ author: { equals: owner.id } }, { visibility: { equals: 'published' } }],
      },
      sort: '-createdAt',
      // Глубже на шаг: нужны кадры самих видео - из них собирается обложка
      // плейлисту, у которого своей нет.
      depth: 2,
      limit: 40,
      overrideAccess: true,
    });

    return json({
      channel,
      authorName: owner.name ?? null,
      sets: sets.docs.flatMap((raw) => {
        const doc = raw as {
          id: string | number;
          title?: string;
          shortCode?: string | null;
          description?: string | null;
          cover?: { url?: string } | null;
          items?: unknown[];
        };
        if (!doc.shortCode) return [];
        return [
          {
            id: doc.id,
            code: doc.shortCode,
            title: doc.title?.trim() || 'Плейлист',
            description: doc.description?.trim() || null,
            cover: doc.cover?.url ?? null,
            // Кадры видео: ими плейлист показывается, когда своей обложки нет.
            covers: playlistCovers(doc.items ?? []),
            count: doc.items?.length ?? 0,
          },
        ];
      }),
      videos: await channelItems(req, videos.docs),
    });
  },
};

/**
 * Записи канала в том же виде, в каком их отдаёт подборка.
 *
 * @remarks
 * Вид общий не ради экономии: витрину рисует та же карточка, что и подборку,
 * и она уже умеет замок, затемнение и подпись о том, почему запись не играет.
 * Свой вид записи означал бы вторую карточку с тем же смыслом и своей вёрсткой.
 *
 * Замок считается политикой доступа, а не полем записи: у того, кто право
 * получил, закрытая запись открыта, и витрина обязана показывать это ему так же,
 * как страница подборки.
 */
async function channelItems(
  req: Parameters<NonNullable<Endpoint['handler']>>[0],
  docs: ReadonlyArray<unknown>,
): Promise<ReadonlyArray<Record<string, unknown>>> {
  const policy = entitlementPolicy(payloadEntitlements(req.payload));
  const items: Array<Record<string, unknown>> = [];

  for (const raw of docs) {
    const doc = raw as {
      id: string | number;
      caption?: string;
      alt?: string;
      shortCode?: string | null;
      createdAt?: string;
      access?: string;
      uploadedBy?: unknown;
      preview?: { url?: string; isDark?: boolean | null } | null;
      hls?: {
        durationSeconds?: number | null;
        deletedAt?: string | null;
        playlistUrl?: string | null;
        status?: string;
      } | null;
    };
    if (!doc.shortCode || doc.hls?.deletedAt) continue;

    const access = doc.access === 'private' ? 'private' : 'public';
    const decision = await policy.decide({ id: doc.id, access }, viewerOf(req, doc.uploadedBy));

    items.push({
      id: doc.id,
      code: doc.shortCode,
      title: doc.caption?.trim() || doc.alt?.trim() || 'Видео',
      playlistUrl: doc.hls?.playlistUrl ?? null,
      poster: doc.preview?.url ?? null,
      posterIsDark: doc.preview?.isDark ?? null,
      durationSeconds: doc.hls?.durationSeconds ?? null,
      createdAt: doc.createdAt ?? null,
      ready: doc.hls?.status === 'ready',
      locked: !decision.allowed,
      lockReason: decision.allowed ? null : decision.reason,
    });
  }

  return items;
}

/** Видео плейлиста в том виде, в каком он приходит из связи. */
type PlaylistVideo = {
  id: string | number;
  alt?: string;
  caption?: string;
  filename?: string;
  shortCode?: string | null;
  access?: string;
  // Нужен, чтобы автор видел свои закрытые видео в списке плейлиста без замка.
  uploadedBy?: unknown;
  preview?: { url?: string; isDark?: boolean | null } | null;
  hls?: {
    status?: string;
    playlistUrl?: string | null;
    durationSeconds?: number | null;
    deletedAt?: string | null;
  } | null;
};

/**
 * Отдаёт плейлист: сведения о нём и его видео по порядку.
 *
 * @remarks
 * Закрытые видео, в отличие от канала, из списка не убираются: плейлист и есть
 * витрина, а его состав — продающая часть. Наружу от закрытого видео уходит
 * только название и обложка; играть он не начнёт, ключ выдаётся отдельно
 * и по тем же правилам.
 *
 * Замок считается по зрителю: куки страница пробрасывает, поэтому у вошедшего
 * с правом на плейлист видео открыты, а у постороннего закрыты.
 */
/** Плейлист в том виде, в каком он приходит из базы. */
type PlaylistDoc = {
  id: string | number;
  title?: string;
  shortCode?: string | null;
  description?: string | null;
  cover?: { url?: string; isDark?: boolean | null } | null;
  author?: { id?: string | number; channel?: string; name?: string } | string | number | null;
  items?: ReadonlyArray<{ video?: PlaylistVideo | string | number | null }> | null;
};

/**
 * Собирает ответ о плейлисте: сведения о нём и его видео с замками.
 *
 * @remarks
 * Один и тот же ответ нужен странице плейлиста и блоку на произвольной странице,
 * поэтому собирается в одном месте — иначе замок считался бы в двух местах и
 * рано или поздно по-разному.
 */
async function describePlaylist(
  doc: PlaylistDoc,
  req: Parameters<NonNullable<Endpoint['handler']>>[0],
): Promise<Record<string, unknown>> {
  const author = typeof doc.author === 'object' && doc.author ? doc.author : null;
  const policy = entitlementPolicy(payloadEntitlements(req.payload));

  const items = [];
  for (const entry of doc.items ?? []) {
    const video = typeof entry?.video === 'object' && entry.video ? entry.video : null;
    // Помеченный к удалению из плейлиста пропадает сразу, как и с сайта.
    if (!video || !video.shortCode || video.hls?.deletedAt) continue;

    const access = video.access === 'private' ? 'private' : 'public';
    const decision = await policy.decide({ id: video.id, access }, viewerOf(req, video.uploadedBy));

    items.push({
      id: video.id,
      code: video.shortCode,
      // Адрес потока отдаём всем, включая закрытые: без ключа это плейлист
      // случайных байт, ровно поэтому сегменты и лежат в общем кеше сети
      // раздачи. Зато после введённого кода замок снимается на месте —
      // адрес уже известен, и перезагружать страницу не нужно.
      playlistUrl: video.hls?.playlistUrl ?? null,
      title: video.caption?.trim() || video.alt?.trim() || 'Видео',
      poster: video.preview?.url ?? null,
      posterIsDark: video.preview?.isDark ?? null,
      durationSeconds: video.hls?.durationSeconds ?? null,
      ready: video.hls?.status === 'ready',
      locked: !decision.allowed,
      lockReason: decision.allowed ? null : decision.reason,
    });
  }

  /*
    Есть ли чем открыть закрытое в этой подборке. Спрашиваем только когда
    закрытое здесь есть: страница ставит форму ввода кода на место плеера,
    и без живого кода она предлагала бы ввести несуществующее.
  */
  const openableByCode = items.some((item) => item.locked)
    ? await hasWayIn(req.payload, { kind: 'playlists', id: doc.id })
    : false;

  return {
    // Номер нужен спискам на странице: по нему они узнают, их ли подборку
    // открыл введённый код.
    id: doc.id,
    code: doc.shortCode ?? null,
    channel: author?.channel ?? null,
    authorName: author?.name ?? null,
    openableByCode,
    title: doc.title ?? 'Плейлист',
    description: doc.description ?? null,
    // Своя обложка плейлиста важнее, но если её не выбрали — берём кадр первого
    // видео: пустое место выглядит недоделкой, а кадр и так снят при нарезке.
    // Подставляется при выдаче, а не пишется в базу, иначе автоподстановка
    // однажды затрёт обложку, выбранную руками.
    cover: doc.cover?.url ?? items.find((item) => item.poster)?.poster ?? null,
    // Яркость - от той картинки, которая в итоге показывается: своей обложки
    // или подставленного кадра. По ней страница выбирает цвет текста поверх.
    coverIsDark: doc.cover?.url
      ? (doc.cover.isDark ?? null)
      : (items.find((item) => item.poster)?.posterIsDark ?? null),
    items,
  };
}

/**
 * Отдаёт плейлист по адресу канала и короткому коду.
 *
 * @remarks
 * Адрес сверяется целиком, как у видео: иначе один плейлист открывался бы
 * с любым каналом в ссылке и поисковик видел бы дубли одной страницы.
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

    const doc = found.docs[0] as PlaylistDoc | undefined;
    if (!doc) return json({ error: 'not-found' }, 404);

    const author = typeof doc.author === 'object' && doc.author ? doc.author : null;
    if ((author?.channel ?? '') !== channel) return json({ error: 'not-found' }, 404);

    return json(await describePlaylist(doc, req));
  },
};

/**
 * Отдаёт плейлист по его номеру.
 *
 * @remarks
 * Для блока на произвольной странице: он знает плейлист по связи, а короткого
 * адреса и канала у него под рукой нет.
 */
export const videoPlaylistByIdEndpoint: Endpoint = {
  path: '/video/playlist-by-id/:id',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан плейлист.' }, 400);

    const doc = (await req.payload.findByID({
      collection: 'playlists',
      id: String(id),
      depth: 2,
      overrideAccess: true,
    })) as PlaylistDoc | null;
    if (!doc) return json({ error: 'not-found' }, 404);

    return json(await describePlaylist(doc, req));
  },
};

/**
 * Говорит, откроется ли видео у этого зрителя.
 *
 * @remarks
 * Нужен странице: она решает, рисовать плеер или заглушку, ещё до того как
 * браузер что-то загрузит. Без этого закрытый видео показывал бы обычный
 * плеер, а отказ всплывал только по нажатию «play» — то есть выглядел бы
 * поломкой, а не закрытым доступом.
 *
 * Секрета в ответе нет: только решение и его причина.
 */
/**
 * Манифест со своего домена.
 *
 * @remarks
 * Файл остаётся в хранилище рядом с сегментами, но плеер берёт его отсюда.
 * Иначе относительные ссылки внутри - включая путь ключа - разрешаются от
 * адреса раздачи: у одного сайта она за тем же доменом, у другого отдельным
 * поддоменом, у третьего в чужом облаке.
 *
 * Через сайт идёт только текст манифеста. Сегменты уводятся прямо в раздачу
 * переписыванием ссылок, поэтому мегабайты мимо нас и мимо CDN не гоняются.
 */
export const videoManifestEndpoint: Endpoint = {
  path: '/video/:id/manifest/:part*',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указана запись.' }, 400);

    const base = (process.env['S3_PUBLIC_URL'] ?? '').replace(/\/+$/, '');
    if (!base) return json({ error: 'storage-not-configured' }, 503);

    const doc = (await req.payload
      .findByID({ collection: 'media', id: String(id), depth: 0, overrideAccess: true })
      .catch(() => null)) as { hls?: { prefix?: string | null; deletedAt?: string | null } } | null;

    const prefix = doc?.hls?.prefix?.replace(/^\/+|\/+$/g, '');
    if (!prefix || doc?.hls?.deletedAt) return json({ error: 'not-found' }, 404);

    /*
      Часть пути приходит из адреса: пусто - это master.m3u8, иначе вложенный
      манифест вида `480p/index.m3u8`. Ничего, кроме манифестов, отсюда не
      отдаётся: сегменты идут прямо из раздачи, и превращать это в общий
      проксировщик незачем.
    */
    const raw = req.routeParams?.['part'];
    const part = Array.isArray(raw) ? raw.join('/') : String(raw ?? '');
    const file = part === '' ? 'master.m3u8' : part;
    if (!file.endsWith('.m3u8') || file.includes('..')) return json({ error: 'not-found' }, 404);

    const source = `${base}/${prefix}/${file}`;
    const response = await fetch(source).catch(() => null);
    if (!response?.ok) return json({ error: 'not-found' }, 404);

    const folder = source.slice(0, source.lastIndexOf('/'));
    /*
      Ссылки внутри собираются на ту дверь, через которую браузер сюда пришёл:
      клиент проксирует манифесты под своим префиксом (R15), и уводить плеер
      обратно на /api значило бы гнать его мимо этой двери.
    */
    const own = `/internal/video/manifest/${String(id)}${file === 'master.m3u8' ? '' : `/${file.slice(0, file.lastIndexOf('/'))}`}`;

    return new Response(rewriteManifest(await response.text(), { folder, own }), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.mpegurl; charset=utf-8',
        // Манифест меняется только при перенарезке, а адрес тогда меняется тоже:
        // в нём стоит своя папка. Держать его в кеше недолго - дёшево и честно.
        'cache-control': 'public, max-age=60',
      },
    });
  },
};

export const videoAccessEndpoint: Endpoint = {
  path: '/video/:id/access',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан видео.' }, 400);

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
 * Погашает код доступа.
 *
 * @remarks
 * Код не хранит доступ, а выдаёт его: сработав, он превращается в обычную
 * запись права - на учётную запись, если зритель вошёл, и на его идентичность,
 * если нет. Отозвать такое право можно у любого, и держится оно не токеном.
 *
 * В ответе всё же новый токен: он продлён до конца выданного права, иначе
 * человек добывал бы код заново каждый вечер. Идентичность и ключ шифрования
 * внутри сохраняются прежними - подмена ключа посреди сеанса оборвала бы
 * идущий просмотр, а подмена идентичности отрезала бы зрителя от только что
 * записанного права.
 */
export const videoRedeemEndpoint: Endpoint = {
  path: '/video/redeem',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { code?: string } | undefined;
    const raw = String(body?.code ?? '');
    if (!raw) return json({ error: 'Не указан код.' }, 400);

    // Идентичность приходит кукой. У того, кто вводит код впервые, её ещё нет:
    // заводим тут же, иначе право не на кого записать.
    const token = tokenFromCookie(req) ?? issueViewerToken(appSecret(), nowSeconds()).value;

    // Приводим к виду выдачи: человек диктует и переписывает с ошибками ровно
    // там, где символы похожи.
    const code = normalizeAccessCode(raw);
    if (!code) return json({ error: 'not-found' }, 404);

    /*
      Подбор кода отсекаем по адресу обратившегося: шесть символов машина
      перебирает за часы, а живой человек ошибается два-три раза подряд.

      Ответ при этом тот же, что и на неверный код: по разнице между «не тот
      код» и «слишком часто» перебор понимал бы, что нащупал верный.
    */
    const client = clientKey(req);
    const attempt = checkRedeemAttempt(client);
    if (!attempt.allowed) {
      return new Response(JSON.stringify({ error: 'invalid' }), {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(attempt.retryAfterSeconds),
        },
      });
    }

    const found = await req.payload.find({
      collection: 'media-access-codes',
      where: { code: { equals: code } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0] as
      | {
          id: string | number;
          access?: string | number | { id?: string | number } | null;
          revoked?: boolean | null;
          maxUses?: number | null;
          usedCount?: number | null;
          expiresAt?: string | null;
          grantDays?: number | null;
          grantMinutes?: number | null;
        }
      | undefined;

    // С глубиной ноль в связи лежит номер, с большей - сам документ.
    const accessId =
      typeof doc?.access === 'object' && doc.access !== null ? doc.access.id : doc?.access;

    const result = redeemCode({
      code:
        doc && accessId !== undefined && accessId !== null
          ? {
              id: doc.id,
              accessId,
              revoked: doc.revoked === true,
              maxUses: doc.maxUses ?? null,
              usedCount: doc.usedCount ?? 0,
              expiresAt: doc.expiresAt ?? null,
              grantDays: doc.grantDays ?? null,
              grantMinutes: doc.grantMinutes ?? null,
            }
          : null,
      viewerId: req.user?.id ?? null,
      now: new Date(),
    });

    if (!result.ok) {
      // Наружу одна причина на все случаи «код не сработал»: разные ответы
      // подсказывали бы перебору, какой код существует, какой просрочен, а
      // какой израсходован.
      noteRedeemMiss(client);
      return json({ error: 'invalid' }, 403);
    }

    // Код подошёл - счёт промахов обнуляется: человек, ошибшийся пару раз,
    // дальше работает без задержек.
    forgetRedeemMisses(client);

    /*
      Токен продлеваем до конца выданного права: код открывает курс на недели,
      а токен без продления умирал бы за вечер, и человек шёл бы за новым кодом
      каждый день. Само право в токен не кладётся - оно записывается ниже.
    */
    const grantedUntil = result.expiresAt
      ? Math.floor(new Date(result.expiresAt).getTime() / 1000)
      : null;
    const next = withExtendedLife(token, appSecret(), nowSeconds(), grantedUntil);
    // Токен просрочен или испорчен: идентичности в нём нет, записать право не на
    // что. Погашение засчитывать при этом нечестно — код должен остаться рабочим.
    if (!next) return json({ error: 'bad-token' }, 403);

    const checked = readViewerToken(next, appSecret(), nowSeconds());
    if (!checked.ok) return json({ error: 'bad-token' }, 403);

    // Счётчик срабатываний растёт только после того, как право реально выдано.
    await req.payload.update({
      collection: 'media-access-codes',
      id: doc!.id,
      data: { usedCount: (doc!.usedCount ?? 0) + 1 },
      overrideAccess: true,
    });

    /*
      Право записывается всегда - и вошедшему, и тому, кто учётной записи
      не заводил. Разница только в том, чем оно держится: у первого учётной
      записью, у второго идентичностью из токена.

      Записью, а не пометкой в токене: пока право жило в токене, снять его было
      нельзя - сервер о нём не знал вовсе.
    */
    await writeEntitlement({
      payload: req.payload,
      holder:
        result.bind === 'account' && req.user?.id
          ? { kind: 'account', userId: req.user.id }
          : { kind: 'identity', visitorMarker: checked.visitorMarker },
      target: { accessId: result.accessId },
      grantedUntil: result.expiresAt ?? null,
      source: 'promo',
      note: `Код ${code}`,
    });

    /*
      Продлённый токен запоминается браузером: без этого идентичность сменится
      на следующей же перезагрузке, и записанное право не найдётся.

      В ответе - состав доступа: страница снимает замки по нему. Одного адреса
      мало, доступ покрывает и подборки, и отдельные записи разом.
    */
    const opened = await accessContents(req.payload, result.accessId);

    return jsonWithToken(
      { token: next, accessId: result.accessId, granted: opened },
      next,
      checked.expires,
    );
  },
};

/**
 * Выдаёт токен зрителя.
 *
 * @remarks
 * Открыт для всех, включая не вошедших: сам по себе токен ничего не открывает,
 * он лишь опознаёт того, кто пришёл. Право смотреть проверяется
 * отдельно, при выдаче ключа.
 */
export const videoTokenEndpoint: Endpoint = {
  path: '/video/token',
  method: 'post',
  handler: (req) => {
    // Уже выданный токен важнее нового: в нём идентичность, по которому находятся
    // права зрителя, и свежий токен отрезал бы его от них.
    const saved = tokenFromCookie(req);
    if (saved) {
      const checked = readViewerToken(saved, appSecret(), nowSeconds());
      if (checked.ok) return json({ token: saved });
    }

    const token = issueViewerToken(appSecret(), nowSeconds());
    // Наружу уходит только идентичность со сроком и подписью: ключей в токене
    // нет, за ними приходят отдельно и по одному.
    return jsonWithToken({ token: token.value }, token.value, token.expires);
  },
};

/**
 * Отдаёт ключ криптопериода.
 *
 * @remarks
 * Отказ возвращается кодом 403 с причиной, а не пустым телом: плееру нужно
 * отличать «войди» от «видео ещё готовится», чтобы показать нужную заглушку
 * вместо чёрного квадрата.
 */
export const videoKeyEndpoint: Endpoint = {
  path: '/video/:id/key',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан видео.' }, 400);

    /*
      Ключ выдаём плееру на нашем сайте. Чужая страница, встроившая поток,
      получает отказ: платный курс не должен крутиться на стороннем сайте под
      чужой рекламой.

      От выкачивания это не защищает - заголовки подделываются, - и такой
      случай ловится частотой запросов.
    */
    const origin = checkRequestOrigin(req.headers, allowedOrigins());
    if (!origin.allowed) return json({ error: 'foreign-origin' }, 403);

    /*
      Ключ у записи не один: она поделена на криптопериоды, и у каждого свой
      ключ, выведенный из секрета. Плеер просит ключ того периода, к которому
      подошёл, - номер стоит в адресе.

      Длина периода берётся у записи, а не из настройки: настройку владелец
      меняет когда угодно, и деление на новое значение дало бы другие границы -
      уже нарезанное перестало бы играть. Пусто - запись нарезана до появления
      криптопериодов, у неё единственный ключ на всю длину.
    */
    const asked = new URL(req.url ?? '', 'http://localhost').searchParams.get('p');
    const period = asked === null ? null : Number(asked);
    if (period !== null && (!Number.isInteger(period) || period < 0)) {
      return json({ error: 'bad-period' }, 400);
    }

    /*
      Зритель просит ключ раз в несколько минут, скачиватель - десятками подряд.
      Считаем темп по разным ключам: страница держит плеер в блоке, в тексте
      и в подборке, все просят один и тот же - повтор запаса не тратит.
    */
    const rate = await checkKeyRateShared(
      req.payload,
      clientKey(req),
      `${String(id)}:${asked ?? '-'}`,
    );
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'too-many-keys' }), {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(rate.retryAfterSeconds),
        },
      });
    }

    // Токен приходит кукой, а не параметром адреса: в адресе он оседал бы
    // в логах прокси и в заголовке перехода, а кука закрыта от скриптов.
    const token = tokenFromCookie(req) ?? '';

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
      hls?: {
        status?: string;
        secret?: string | null;
        cryptoPeriod?: number | null;
        deletedAt?: string | null;
      };
    };

    // Помеченный к удалению не играет: файлы ещё лежат, и без этой проверки
    // прямая ссылка продолжала бы показывать то, что владелец убрал.
    if (doc.hls?.deletedAt) return json({ error: 'not-found' }, 404);

    // Секрет лежит в базе завёрнутым в мастер-ключ — разворачиваем перед тем,
    // как отдать его зрителю. Видео, залитые до включения ключа,
    // читаются как есть.
    const stored = doc.hls?.secret ?? null;

    // Криптопериоды у записи есть - значит запрос обязан назвать номер, и наоборот.
    // Несовпадение означает либо старый плеер на новой записи, либо попытку
    // получить корневой секрет, и в обоих случаях отвечать нечем.
    const split = typeof doc.hls?.cryptoPeriod === 'number' && doc.hls.cryptoPeriod >= 1;
    let picked: Buffer | null = null;
    if (stored) {
      const choice = keyForPeriod(unwrapSecret(stored, masterKey()), period, split);
      if (!choice.ok) return json({ error: choice.reason }, 400);
      picked = choice.key;
    }

    const video: StreamRecord = {
      id: doc.id,
      access: doc.access === 'private' ? 'private' : 'public',
      status: (doc.hls?.status as StreamRecord['status']) ?? 'pending',
      secret: picked ? picked.toString('base64') : null,
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

    /*
      Ключ выдан - отмечаем обращение. Под одним правом видны отдельные линии:
      у каждой свой клиент и своё место в записи. Один человек даёт две-три
      (телефон рядом с компьютером, вторая вкладка), десять - уже складчина.

      Отказом не отвечаем: обрывать доступ на лишней линии значит наказывать
      за обычное поведение. Владельцу это видно в журнале, решение - за ним.
    */
    const sharing = noteKeyRequest(
      String(viewerOf(req, doc.uploadedBy).visitorMarker ?? req.user?.id ?? clientKey(req)),
      clientKey(req),
      period ?? 0,
    );
    if (sharing.shared || sharing.apart) {
      const tail = sharing.lines % 10;
      const teen = sharing.lines % 100 >= 11 && sharing.lines % 100 <= 14;
      const word =
        !teen && tail === 1 ? 'линия' : !teen && tail >= 2 && tail <= 4 ? 'линии' : 'линий';
      req.payload.logger.warn(
        `[video] запись ${doc.id}: под одним доступом ${sharing.lines} ${word}` +
          (sharing.apart ? ', и они смотрят разные места записи' : ''),
      );
    }

    /*
      Ключ уходит шестнадцатью байтами, а не строкой в JSON: так его забирает
      штатный загрузчик плеера по адресу из манифеста, и своего кода для этого
      не нужно вовсе.

      Кешировать нечего и нельзя: ответ зависит от того, кто спрашивает.
    */
    return new Response(Buffer.from(result.key, 'base64'), {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/octet-stream' },
    });
  },
};

/**
 * Принимает ссылку-приглашение.
 *
 * @remarks
 * Отдельно от погашения кода, потому что и предмет другой, и защита. Код
 * шестизначный, и его прикрывает задержка после промахов: перебор иначе
 * нащупал бы верный за часы. Адрес ссылки перебирать бессмысленно — в нём
 * около ста тридцати бит, — зато сам адрес расходится по чатам, поэтому у него
 * есть отзыв и обязательный срок.
 *
 * Как и код, ссылка не хранит доступ, а выдаёт его: сработав, она превращается
 * в обычную запись права. Токен в ответе продлён до конца выданного права —
 * идентичность и ключ шифрования внутри остаются прежними, иначе оборвался бы
 * идущий просмотр.
 */
export const videoRedeemLinkEndpoint: Endpoint = {
  path: '/video/redeem-link',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { link?: string } | undefined;
    const address = String(body?.link ?? '').trim();
    if (!address) return json({ error: 'Не указана ссылка.' }, 400);

    // Как и у кода: идентичность приходит кукой, а у пришедшего по ссылке впервые
    // её нет - заводим на месте.
    const token = tokenFromCookie(req) ?? issueViewerToken(appSecret(), nowSeconds()).value;

    // Очевидно чужой адрес отсекаем без похода в базу: длина и алфавит у нашего
    // свои, и на них приходится всё, что можно проверить дёшево.
    if (!looksLikeLinkToken(address)) return json({ error: 'invalid' }, 404);

    /*
      Токен зрителя читаем до погашения: в нём идентичность, на которое ляжет право.
      Испорченный или просроченный означает, что записывать право не на что, -
      и ссылку при этом не тратим, она должна остаться рабочей.
    */
    const checked = readViewerToken(token, appSecret(), nowSeconds());
    if (!checked.ok) return json({ error: 'bad-token' }, 403);

    const result = await acceptLink({
      payload: req.payload,
      token: address,
      holder: req.user?.id
        ? { kind: 'account', userId: req.user.id }
        : { kind: 'identity', visitorMarker: checked.visitorMarker },
      now: new Date(),
    });

    if (!result.ok) {
      /*
        Наружу две разные причины, а не одна: отозванную и просроченную ссылку
        человек получил от знакомого и должен понять, что просить новую. Скрывать
        тут нечего - подобрать адрес всё равно нельзя, а «не сработало» без
        объяснения отправило бы его жаловаться выдавшему.
      */
      const status = result.reason === 'not-found' ? 404 : 403;
      return json({ error: result.reason }, status);
    }

    /*
      Токен продлеваем до конца выданного права: ссылка открывает подборку
      на недели, а токен без продления умер бы за вечер. Идентичность и ключ
      внутри сохраняются прежними.
    */
    const grantedUntil = result.grantedUntil
      ? Math.floor(new Date(result.grantedUntil).getTime() / 1000)
      : null;
    const next = withExtendedLife(token, appSecret(), nowSeconds(), grantedUntil);
    if (!next) return json({ error: 'bad-token' }, 403);

    // Срок берём у продлённого токена, а если его прочесть не удалось -
    // у прежнего: ответ должен уйти с честной датой, а не с пустой.
    const refreshed = readViewerToken(next, appSecret(), nowSeconds());

    /*
      Вместе с правом отдаём адрес: тот, кто нажал ссылку, ждёт содержимого,
      а не сообщения об успехе. Право живёт номерами, страница адресуется
      каналом и коротким кодом, поэтому адрес ищется отдельно - и может
      не найтись у только что залитого, тогда ведём на канал целиком.
    */
    const opened = await accessContents(req.payload, result.accessId);
    const first = opened[0];
    const target = first ? await resourceAddress(req.payload, first) : null;

    return jsonWithToken(
      { token: next, accessId: result.accessId, granted: opened, address: target },
      next,
      refreshed.ok ? refreshed.expires : checked.expires,
    );
  },
};
