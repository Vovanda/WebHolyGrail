/**
 * Поток: манифест с переписанными адресами.
 */
import type { Endpoint } from 'payload';
import { rewriteManifest } from '../../lib/video/manifest';
import { json } from './shared';
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
