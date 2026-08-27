import type { Endpoint } from 'payload';

import { payloadEntitlements } from '../lib/video/entitlement-source';
import { entitlementPolicy } from '../lib/video/entitlements';
import {
  checkRedeemAttempt,
  forgetRedeemMisses,
  noteRedeemMiss,
} from '../lib/video/redeem-throttle';
import { issueViewerToken, readViewerToken, withGrantedPlaylist } from '../lib/video/envelope';
import { grantStreamAccess, type StreamRecord } from '../lib/video/grant-access';
import { masterKey, unwrapSecret } from '../lib/video/key-vault';
import { generateAccessCode, normalizeAccessCode } from '../lib/video/short-code';
import { redeemCode } from '../lib/video/redeem';

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

/**
 * Имя куки с токеном зрителя.
 *
 * @remarks
 * Токен носит в себе права, выданные по коду, поэтому обязан переживать
 * перезагрузку страницы. Без этого зритель вводит код, страница обновляется,
 * сервер выписывает новый пустой токен — и замок возвращается.
 */
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

const VIEWER_COOKIE = 'whg-viewer';

/** Ответ с токеном, который браузер запомнит. */
function jsonWithToken(body: Record<string, unknown>, token: string, expires: number): Response {
  const maxAge = Math.max(0, expires - nowSeconds());
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...noStore,
      // Не секрет: токен и так уходит в разметку страницы. Кука нужна затем,
      // чтобы он не терялся между заходами, поэтому httpOnly не ставим —
      // плеер читает его же из разметки.
      'Set-Cookie': `${VIEWER_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`,
    },
  });
}

/** Токен, уже выданный этому браузеру. */
function tokenFromCookie(req: { headers?: Headers }): string | null {
  const raw = req.headers?.get('cookie') ?? '';
  const match = raw.match(new RegExp(`(?:^|;\s*)${VIEWER_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

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
    // канала один ролик открывался бы с любым именем в ссылке, и поисковик
    // видел бы десяток дублей одной страницы.
    const owner = typeof doc.uploadedBy === 'object' && doc.uploadedBy ? doc.uploadedBy : null;
    if ((owner?.channel ?? '') !== channel) return json({ error: 'not-found' }, 404);

    /*
      В какие наборы входит это видео.

      Зритель приходит и со страницы канала, и по прямой ссылке - тогда набора
      рядом нет, и после просмотра идти некуда. Список наборов даёт следующий
      шаг: видно, что видео часть серии, и куда за остальным.

      Закрытые наборы отсюда не показываем - тем же правилом, что и на канале:
      страница открыта всем, включая поисковик, и перечень закрытого стал бы
      описью платного для тех, кто его не брал.
    */
    const sets = await req.payload.find({
      collection: 'playlists',
      where: {
        and: [{ 'items.video': { equals: doc.id } }, { access: { not_equals: 'private' } }],
      },
      depth: 0,
      limit: 12,
      overrideAccess: true,
    });

    return json({
      id: doc.id,
      channel,
      authorName: owner?.name ?? null,
      sets: sets.docs.map((set) => {
        const item = set as {
          id: string | number;
          title?: string;
          shortCode?: string;
          items?: unknown[];
        };
        return {
          id: item.id,
          code: item.shortCode ?? null,
          title: item.title?.trim() || 'Набор',
          count: item.items?.length ?? 0,
        };
      }),
      title: doc.caption?.trim() || doc.alt?.trim() || doc.filename || 'Видео',
      description: doc.alt?.trim() || null,
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

    /*
      Наборы автора. Показываем открытые: канал видит любой, включая поисковик,
      и перечень закрытого стал бы описью платного для тех, кто его не брал -
      тем же правилом, что и для отдельных записей.
    */
    const sets = await req.payload.find({
      collection: 'playlists',
      where: {
        and: [{ author: { equals: owner.id } }, { access: { not_equals: 'private' } }],
      },
      sort: '-createdAt',
      depth: 1,
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
            title: doc.title?.trim() || 'Набор',
            description: doc.description?.trim() || null,
            cover: doc.cover?.url ?? null,
            count: doc.items?.length ?? 0,
          },
        ];
      }),
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
  // Нужен, чтобы автор видел свои закрытые ролики в списке набора без замка.
  uploadedBy?: unknown;
  preview?: { url?: string } | null;
  hls?: {
    status?: string;
    playlistUrl?: string | null;
    durationSeconds?: number | null;
    deletedAt?: string | null;
  } | null;
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
/** Набор в том виде, в каком он приходит из базы. */
type PlaylistDoc = {
  id: string | number;
  title?: string;
  shortCode?: string | null;
  description?: string | null;
  cover?: { url?: string } | null;
  author?: { id?: string | number; channel?: string; name?: string } | string | number | null;
  items?: ReadonlyArray<{ video?: PlaylistVideo | string | number | null }> | null;
};

/**
 * Собирает ответ о наборе: сведения о нём и его ролики с замками.
 *
 * @remarks
 * Один и тот же ответ нужен странице набора и блоку на произвольной странице,
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
    // Помеченный к удалению из набора пропадает сразу, как и с сайта.
    if (!video || !video.shortCode || video.hls?.deletedAt) continue;

    const access = video.access === 'private' ? 'private' : 'public';
    const decision = await policy.decide({ id: video.id, access }, viewerOf(req, video.uploadedBy));

    items.push({
      id: video.id,
      code: video.shortCode,
      // Адрес потока отдаём всем, включая закрытые: без ключа это набор
      // случайных байт, ровно поэтому сегменты и лежат в общем кеше сети
      // раздачи. Зато после введённого кода замок снимается на месте —
      // адрес уже известен, и перезагружать страницу не нужно.
      playlistUrl: video.hls?.playlistUrl ?? null,
      title: video.caption?.trim() || video.alt?.trim() || video.filename || 'Видео',
      poster: video.preview?.url ?? null,
      durationSeconds: video.hls?.durationSeconds ?? null,
      ready: video.hls?.status === 'ready',
      locked: !decision.allowed,
      lockReason: decision.allowed ? null : decision.reason,
    });
  }

  return {
    code: doc.shortCode ?? null,
    channel: author?.channel ?? null,
    authorName: author?.name ?? null,
    title: doc.title ?? 'Набор',
    description: doc.description ?? null,
    // Своя обложка набора важнее, но если её не выбрали — берём кадр первого
    // ролика: пустое место выглядит недоделкой, а кадр и так снят при нарезке.
    // Подставляется при выдаче, а не пишется в базу, иначе автоподстановка
    // однажды затрёт обложку, выбранную руками.
    cover: doc.cover?.url ?? items.find((item) => item.poster)?.poster ?? null,
    items,
  };
}

/**
 * Отдаёт набор по адресу канала и короткому коду.
 *
 * @remarks
 * Адрес сверяется целиком, как у ролика: иначе один набор открывался бы
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
 * Отдаёт набор по его номеру.
 *
 * @remarks
 * Для блока на произвольной странице: он знает набор по связи, а короткого
 * адреса и канала у него под рукой нет.
 */
export const videoPlaylistByIdEndpoint: Endpoint = {
  path: '/video/playlist-by-id/:id',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан набор.' }, 400);

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
 * Выдаёт демонстрационный код на набор.
 *
 * @remarks
 * Витрина обязана давать потрогать: иначе про доступ по коду приходится верить
 * на слово. Посетитель нажимает кнопку, получает код и тут же вводит его —
 * и закрытые ролики набора открываются у него на глазах.
 *
 * Включается флагом окружения и по умолчанию молчит. В обычном инстансе такой
 * генератор печатал бы посторонним ключи от платного, поэтому это не настройка
 * в админке, которую можно случайно включить, а решение при развёртывании.
 *
 * Код одноразовый и живёт минуты: он нужен ровно на один показ, а не на то,
 * чтобы разойтись по чатам.
 */
export const videoDemoCodeEndpoint: Endpoint = {
  path: '/video/demo-code',
  method: 'post',
  handler: async (req) => {
    const playlistId = process.env['DEMO_CODE_PLAYLIST'];
    if (!playlistId) return json({ error: 'disabled' }, 404);

    const minutes = Number(process.env['DEMO_CODE_TTL_MINUTES'] ?? 15);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    /*
      Выданный код всегда начинает с чистого листа.

      Символов в коде немного, и рано или поздно тот же набор символов выпадет
      снова. Если бы при этом сохранялась прежняя история срабатываний,
      человек получил бы рабочий на вид код и отказ «уже использован» — при
      том, что этот ключ выдан ему только что.

      Поэтому запись с таким кодом переписывается: новый набор, новый срок,
      счётчик обнулён. Заодно это не плодит записи на каждое нажатие кнопки.
    */
    const code = generateAccessCode(6);
    const data = {
      code,
      playlist: Number(playlistId),
      // Без входа: посетитель витрины не должен заводить учётную запись,
      // чтобы посмотреть, как работает доступ.
      requiresSignIn: false,
      maxUses: 1,
      usedCount: 0,
      expiresAt,
      grantDays: 1,
    };

    const clash = await req.payload.find({
      collection: 'access-codes',
      where: { code: { equals: code } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });

    const previous = clash.docs[0] as { id: string | number } | undefined;
    if (previous) {
      await req.payload.update({
        collection: 'access-codes',
        id: previous.id,
        data,
        overrideAccess: true,
      });
    } else {
      await req.payload.create({ collection: 'access-codes', data, overrideAccess: true });
    }

    return json({ code, expiresAt });
  },
};

/**
 * Погашает код доступа.
 *
 * @remarks
 * Код не хранит доступ, а выдаёт его: сработав, он дописывает набор прямо
 * в токен зрителя. Поэтому в ответе новый токен — старый заменяется им на
 * странице, и закрытые ролики набора начинают играть без перезагрузки.
 *
 * Ключ шифрования конвертов внутри токена сохраняется прежним: подмена его
 * посреди сеанса оборвала бы уже идущий просмотр.
 */
export const videoRedeemEndpoint: Endpoint = {
  path: '/video/redeem',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { code?: string; token?: string } | undefined;
    const raw = String(body?.code ?? '');
    const token = String(body?.token ?? '');
    if (!raw || !token) return json({ error: 'Не указан код.' }, 400);

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
      collection: 'access-codes',
      where: { code: { equals: code } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0] as
      | {
          id: string | number;
          playlist?: string | number;
          requiresSignIn?: boolean;
          maxUses?: number | null;
          usedCount?: number | null;
          expiresAt?: string | null;
          grantDays?: number | null;
        }
      | undefined;

    const result = redeemCode({
      code: doc
        ? {
            id: doc.id,
            playlistId: doc.playlist ?? '',
            requiresSignIn: doc.requiresSignIn !== false,
            maxUses: doc.maxUses ?? null,
            usedCount: doc.usedCount ?? 0,
            expiresAt: doc.expiresAt ?? null,
            grantDays: doc.grantDays ?? null,
          }
        : null,
      viewerId: req.user?.id ?? null,
      now: new Date(),
    });

    if (!result.ok) {
      // Наружу одна причина на все случаи «код не сработал»: разные ответы
      // подсказывали бы перебору, какой код существует, какой просрочен, а
      // какой израсходован. Отдельно остаётся требование входа — оно про
      // самого зрителя, а не про код.
      const reason = result.reason === 'sign-in-required' ? 'sign-in-required' : 'invalid';
      // Промах засчитываем только когда дело в самом коде: требование входа -
      // про зрителя, и наказывать за него нечем.
      if (reason === 'invalid') noteRedeemMiss(client);
      return json({ error: reason }, 403);
    }

    // Код подошёл - счёт промахов обнуляется: человек, ошибшийся пару раз,
    // дальше работает без задержек.
    forgetRedeemMisses(client);

    /*
      Срок права переносим в токен: код открывает курс на недели, а токен без
      продления умирал бы за вечер, и человек шёл бы за новым кодом каждый день.
    */
    const grantedUntil = result.expiresAt
      ? Math.floor(new Date(result.expiresAt).getTime() / 1000)
      : null;
    const next = withGrantedPlaylist(
      token,
      result.playlistId,
      appSecret(),
      nowSeconds(),
      grantedUntil,
    );
    // Токен просрочен или испорчен: выдавать право в него бессмысленно, а
    // погашение засчитывать нечестно — код должен остаться рабочим.
    if (!next) return json({ error: 'bad-token' }, 403);

    // Счётчик срабатываний растёт только после того, как право реально выдано.
    await req.payload.update({
      collection: 'access-codes',
      id: doc!.id,
      data: { usedCount: (doc!.usedCount ?? 0) + 1 },
      overrideAccess: true,
    });

    // Право, выданное вошедшему, закрепляется за учётной записью: иначе оно
    // пропадёт вместе с токеном, а покупку нужно видеть и продлевать.
    if (result.bind === 'account' && req.user?.id) {
      await req.payload.create({
        collection: 'entitlements',
        data: {
          viewer: req.user.id,
          playlist: Number(result.playlistId),
          source: 'promo',
          expiresAt: result.expiresAt,
          note: `Код ${code}`,
        },
        overrideAccess: true,
      });
    }

    // Токен с новым правом запоминается браузером: иначе оно живёт до первой
    // же перезагрузки страницы.
    const checked = readViewerToken(next, appSecret(), nowSeconds());
    return jsonWithToken(
      { token: next, playlistId: result.playlistId },
      next,
      checked.ok ? checked.expires : nowSeconds(),
    );
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
  handler: (req) => {
    // Уже выданный токен важнее нового: в нём лежат права, полученные по коду,
    // и свежий токен их бы стёр.
    const saved = tokenFromCookie(req);
    if (saved) {
      const checked = readViewerToken(saved, appSecret(), nowSeconds());
      if (checked.ok) return json({ token: saved });
    }

    const token = issueViewerToken(appSecret(), nowSeconds());
    // Наружу уходит только строка токена; ключ конверта живёт внутри неё и
    // отдельно нигде не хранится.
    return jsonWithToken({ token: token.value }, token.value, token.expires);
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
