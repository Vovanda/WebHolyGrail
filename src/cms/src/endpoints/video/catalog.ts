/**
 * Каталог: запись по адресу и содержимое канала.
 */
import type { Endpoint } from 'payload';
import { payloadEntitlements } from '../../lib/video/entitlement-source';
import { entitlementPolicy } from '../../lib/video/entitlements';
import { playlistCovers } from '../../lib/video/playlist-covers';
import { json, viewerOf } from './shared';
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

    return json({
      id: doc.id,
      channel,
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
