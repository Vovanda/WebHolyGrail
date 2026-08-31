/**
 * Подборки: по короткому коду и по номеру.
 */
import type { Endpoint } from 'payload';

import { payloadEntitlements } from '../../lib/video/entitlement-source';
import { entitlementPolicy } from '../../lib/video/entitlements';
import { viewerOf } from './shared';
import { json } from './shared';
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

  return {
    // Номер нужен спискам на странице: по нему они узнают, их ли подборку
    // открыл введённый код.
    id: doc.id,
    code: doc.shortCode ?? null,
    channel: author?.channel ?? null,
    authorName: author?.name ?? null,
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
