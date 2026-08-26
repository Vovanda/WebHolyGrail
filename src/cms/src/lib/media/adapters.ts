import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Payload } from 'payload';

import { DEFAULT_LADDER, transcodeToHls, type HlsRung } from '../hls';
import type { CatalogPort, EncoderPort, StoragePort, VideoPorts } from './ports';
import { POSTER_PREFIX } from '../../collections/Media';

/**
 * Реализации портов подготовки видео: ffmpeg, S3, Payload.
 *
 * @remarks
 * Вся конкретика собрана здесь одним файлом. Сценарий подготовки её не видит,
 * поэтому замена хранилища или переезд кодирования во внешний сервис — это
 * правка только этого файла.
 */

export const ffmpegEncoder: EncoderPort = {
  transcode: (source, options) => transcodeToHls(source, options),
};

/**
 * Хранилище раздачи поверх S3.
 *
 * @remarks
 * Исходник забираем по публичному адресу, а не из бакета напрямую: адрес уже
 * собран плагином хранилища с учётом префикса и CDN, и повторять эту логику
 * здесь — значит разойтись с ней при первой смене настроек.
 */
export function s3Storage(): StoragePort {
  const bucket = process.env['S3_BUCKET'];
  if (!bucket) throw new Error('Нарезка требует S3: переменная S3_BUCKET не задана.');

  const publicBase = process.env['S3_PUBLIC_URL'] ?? '';
  const endpoint = process.env['S3_ENDPOINT'];
  const client = new S3Client({
    region: process.env['S3_REGION'] ?? 'us-east-1',
    // Свой endpoint задают совместимые с S3 провайдеры (MinIO локально,
    // облако у хостера). У самого AWS его нет — тогда ключ не передаём.
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env['S3_ACCESS_KEY_ID'] ?? '',
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] ?? '',
    },
  });

  return {
    async readSource(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Исходник недоступен: ${response.status} ${url}`);
      return Buffer.from(await response.arrayBuffer());
    },

    async put(key, file) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.body,
          ContentType: file.contentType,
          // Сегменты неизменны: их адрес меняется вместе с нарезкой, поэтому
          // кешируются надолго. Плейлист — коротко, он может обновиться.
          CacheControl: key.endsWith('.m3u8')
            ? 'public, max-age=60'
            : 'public, max-age=31536000, immutable',
          ACL: 'public-read',
        }),
      );
    },

    async removeFolder(prefix) {
      let token: string | undefined;
      do {
        const listed = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `${prefix}/`,
            ContinuationToken: token,
          }),
        );
        const keys = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
        if (keys.length > 0) {
          await client.send(
            new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }),
          );
        }
        token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
      } while (token);
    },

    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    keyFromUrl(url) {
      const clean = url.split('?')[0] ?? '';
      return publicBase && clean.startsWith(publicBase) ? clean.slice(publicBase.length + 1) : '';
    },

    urlForKey: (key) => `${publicBase}/${key}`,
  };
}

/** Ступени лесенки, доступные владельцу в настройках сайта. */
const KNOWN_RUNGS = new Map<number, HlsRung>([
  [360, { height: 360, videoKbps: 700, audioKbps: 96 }],
  [480, { height: 480, videoKbps: 1200, audioKbps: 96 }],
  [720, { height: 720, videoKbps: 2800, audioKbps: 128 }],
  [1080, { height: 1080, videoKbps: 5000, audioKbps: 128 }],
]);

/**
 * Собирает лесенку из выбранных владельцем качеств.
 *
 * @remarks
 * Битрейты остаются нашими: это инженерный параметр, от которого зависит,
 * будет ли сыпаться картинка на движении. Выносить его в интерфейс незачем.
 */
export function ladderFromQualities(chosen: ReadonlyArray<string> | null | undefined) {
  if (!chosen || chosen.length === 0) return DEFAULT_LADDER;
  const rungs = chosen
    .map((value) => KNOWN_RUNGS.get(Number(value)))
    .filter((rung): rung is HlsRung => Boolean(rung))
    // Снизу вверх: плеер стартует с нижней ступени, и первый кадр появляется
    // быстрее, чем при старте с верхней.
    .sort((a, b) => a.height - b.height);
  return rungs.length > 0 ? rungs : DEFAULT_LADDER;
}

/** Каталог поверх Payload. */
export function payloadCatalog(payload: Payload): CatalogPort {
  return {
    async read(id) {
      const doc = (await payload.findByID({ collection: 'media', id, depth: 0 })) as {
        id: string | number;
        mimeType?: string;
        filename?: string;
        url?: string;
        preview?: string | number | null;
        uploadedBy?: string | number | null;
        hls?: { prefix?: string | null };
      };
      return {
        id: doc.id,
        mimeType: doc.mimeType ?? '',
        filename: doc.filename ?? null,
        // Метка версии в адресе нужна CDN, а для скачивания только мешает.
        url: String(doc.url ?? '').split('?')[0] ?? '',
        previousPrefix: doc.hls?.prefix ?? null,
        hasPoster: Boolean(doc.preview),
        ownerId: doc.uploadedBy ?? null,
      };
    },

    async saveRendition(id, result) {
      await payload.update({
        collection: 'media',
        id,
        data: {
          hls: {
            playlistUrl: result.playlistUrl,
            prefix: result.prefix,
            qualities: result.qualities.map((height) => ({ height })),
            durationSeconds: result.durationSeconds,
            status: 'ready',
            error: null,
            secret: result.secret,
          },
        },
        // Служебное обновление: без этой отметки запись результата запустила бы
        // новый круг нарезки.
        context: { skipHlsQueue: true },
      });
    },

    async savePoster(id, poster) {
      const created = await payload.create({
        collection: 'media',
        data: { alt: 'Кадр из видео', prefix: POSTER_PREFIX },
        file: {
          data: poster,
          name: `video-${id}-poster.jpg`,
          mimetype: 'image/jpeg',
          size: poster.length,
        },
      });
      await payload.update({
        collection: 'media',
        id,
        data: { preview: created.id },
        context: { skipHlsQueue: true },
      });
    },

    async ladder() {
      const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as {
        video?: { qualities?: ReadonlyArray<string> | null };
      };
      return ladderFromQualities(settings?.video?.qualities);
    },
  };
}

/** Набор портов по умолчанию — то, чем пользуется фоновая задача. */
export const defaultVideoPorts = (payload: Payload): VideoPorts => ({
  encoder: ffmpegEncoder,
  storage: s3Storage(),
  catalog: payloadCatalog(payload),
});
