/**
 * Что запись медиатеки отдаёт наружу вместо того, что лежит в базе.
 *
 * @remarks
 * Здесь только преобразование документа - без сети, базы и Payload, поэтому
 * всё проверяется тестом. В базе значения остаются прежними: они верны для
 * того, кто идёт за файлом напрямую, а меняется только выдача.
 */

type Doc = Record<string, unknown>;

interface HlsView {
  readonly status?: string | null;
  readonly playlistUrl?: string | null;
  readonly prefix?: string | null;
  readonly packBytes?: number | null;
}

/**
 * Адрес манифеста для плеера - зеркальная ручка, а не раздача.
 *
 * @remarks
 * В манифесте стоит путь ключа без домена, и браузер разрешает его от адреса
 * самого манифеста: возьми плеер файл из раздачи - запрос ключа уйдёт туда же,
 * в хранилище.
 */
export function withManifestRoute(doc: Doc): Doc {
  const hls = doc['hls'] as HlsView | undefined;
  if (!hls?.prefix || !hls.playlistUrl) return doc;

  return {
    ...doc,
    hls: { ...hls, playlistUrl: `/internal/video/manifest/${String(doc['id'])}` },
  };
}

/**
 * Нарезанное видео показывается своим пакетом, а не исходником.
 *
 * @remarks
 * Исходник удаляется сразу после нарезки, поэтому адресом, именем и весом
 * записи становятся манифест, путь пакета и вес нарезки - они говорят об одном
 * и том же объекте. Прежний вес уходит в `sourceFilesize`: предпросмотр
 * показывает его с оговоркой, что он от исходника.
 *
 * Миниатюрой служит снятый кадр. Развёрнутая связь идёт первой: у кадра,
 * который пересняли, адрес свежий. Поле рядом с записью - запасной путь для
 * списка, где связь приходит номером.
 */
export function withStreamAddress(doc: Doc): Doc {
  const preview = doc['preview'] as { url?: string } | number | string | null | undefined;
  const posterUrl =
    (typeof preview === 'object' && preview !== null ? preview.url : undefined) ||
    (typeof doc['previewUrl'] === 'string' ? doc['previewUrl'] : undefined);

  const hls = doc['hls'] as HlsView | undefined;
  const streamUrl = hls?.status === 'ready' ? (hls.playlistUrl ?? undefined) : undefined;
  const packName = streamUrl && hls?.prefix ? `${hls.prefix}/master.m3u8` : undefined;
  const packBytes = streamUrl ? (hls?.packBytes ?? undefined) : undefined;
  const sourceFilesize = typeof doc['filesize'] === 'number' ? doc['filesize'] : undefined;

  if (!posterUrl && !streamUrl) return doc;

  return {
    ...doc,
    ...(streamUrl ? { url: streamUrl } : {}),
    ...(packName ? { filename: packName } : {}),
    ...(posterUrl ? { thumbnailURL: posterUrl } : {}),
    ...(packBytes ? { filesize: packBytes, sourceFilesize: sourceFilesize ?? null } : {}),
  };
}

/**
 * Метка версии в адресе файла и его ступеней: `?v=<updatedAt>`.
 *
 * @remarks
 * Раздача держит объект долго и узнаёт его по адресу. Файл, заменённый под тем
 * же именем, она продолжала бы отдавать старым. Сохранение записи сдвигает
 * `updatedAt`, адрес меняется, и раздача идёт за свежим файлом.
 *
 * Файл, подменённый в хранилище мимо админки, метку не сдвигает: запись надо
 * сохранить, чтобы раздача его увидела.
 */
export function withCacheBust(doc: Doc, now: () => number = Date.now): Doc {
  if (!doc['url']) return doc;
  const updatedAt = doc['updatedAt'] as string | Date | undefined;
  const version = updatedAt ? new Date(updatedAt).getTime() : now();
  const bust = (url: unknown): unknown => {
    if (typeof url !== 'string' || !url) return url;
    return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
  };
  const sizes = doc['sizes'] as Record<string, { url?: unknown }> | undefined;

  return {
    ...doc,
    url: bust(doc['url']),
    ...(sizes
      ? {
          sizes: Object.fromEntries(
            Object.entries(sizes).map(([step, size]) => [step, { ...size, url: bust(size?.url) }]),
          ),
        }
      : {}),
  };
}
