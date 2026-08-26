import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';

import { DEFAULT_LADDER, transcodeToHls, type HlsRung } from '../hls';

/**
 * Готовит загруженное видео к просмотру: режет на качества и кладёт рядом с
 * исходником в то же хранилище.
 *
 * @remarks
 * Запускается сама после загрузки файла — от человека в админке не требуется
 * ничего, кроме «выбрать файл». Тяжёлая часть (ffmpeg) живёт в фоновой задаче,
 * а не в запросе загрузки: кодирование ролика занимает минуты, и держать
 * столько открытым HTTP-соединение нельзя.
 *
 * Идемпотентна: повторный прогон стирает прежнюю нарезку и кладёт новую. Это
 * важно, потому что задача может быть перезапущена после сбоя, а мусорные
 * сегменты от прошлой попытки ломают плейлист.
 */
export interface BuildHlsArgs {
  readonly payload: Payload;
  readonly mediaId: string | number;
  readonly logger?: (message: string) => void;
}

export interface BuildHlsSummary {
  readonly qualities: ReadonlyArray<number>;
  readonly files: number;
  readonly durationSeconds: number | null;
}

/**
 * Папка нарезки — случайный адрес, а не номер медиафайла.
 *
 * @remarks
 * По номеру путь к сегментам собирается перебором. Расшифровать поток это всё
 * равно не даст, но и список файлов посторонним ни к чему. Адрес хранится в
 * базе: вычислить его заново нельзя.
 */
const hlsPrefix = (folder: string): string => `hls/${folder}`;

export async function buildHls({
  payload,
  mediaId,
  logger,
}: BuildHlsArgs): Promise<BuildHlsSummary> {
  const log = logger ?? ((m: string) => payload.logger.info(`[build-hls] ${m}`));

  const media = (await payload.findByID({ collection: 'media', id: mediaId, depth: 0 })) as {
    mimeType?: string;
    filename?: string;
    url?: string;
    access?: string;
    hls?: { prefix?: string | null };
  };

  if (!media?.mimeType?.startsWith('video/')) {
    throw new Error(`Медиафайл ${mediaId} — не видео (${media?.mimeType ?? 'тип неизвестен'}).`);
  }

  const bucket = process.env['S3_BUCKET'];
  if (!bucket) throw new Error('Нарезка требует S3: переменная S3_BUCKET не задана.');

  const endpoint = process.env['S3_ENDPOINT'];
  const client = new S3Client({
    region: process.env['S3_REGION'] ?? 'us-east-1',
    // Свой endpoint задают провайдеры, совместимые с S3 (MinIO локально,
    // облако у хостера). У самого AWS его нет — тогда ключ не передаём вовсе.
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env['S3_ACCESS_KEY_ID'] ?? '',
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'] ?? '',
    },
  });

  // Исходник забираем по публичному адресу, а не из бакета напрямую: адрес уже
  // собран плагином хранилища с учётом префикса и CDN, и повторять эту логику
  // здесь — значит разойтись с ней при первой же смене настроек.
  const sourceUrl = String(media.url ?? '').split('?')[0];
  if (!sourceUrl) throw new Error(`У медиафайла ${mediaId} нет адреса файла.`);
  log(`забираю исходник: ${media.filename ?? sourceUrl}`);
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Исходник недоступен: ${response.status} ${sourceUrl}`);
  const source = Buffer.from(await response.arrayBuffer());

  // Адрес непредсказуем всегда: режим доступа переключается в любой момент,
  // и нарезка не должна переезжать вслед за ним.
  const prefix = hlsPrefix(randomUUID());
  const keyUri = `${process.env['PAYLOAD_PUBLIC_SERVER_URL'] ?? ''}/api/media/${mediaId}/hls-key`;

  log('режу на качества');
  const result = await transcodeToHls(source, { ladder: await ladderFrom(payload), keyUri });

  // Чистим по адресу из базы, а не по новому: каждая нарезка получает свой
  // адрес, и прошлые сегменты иначе останутся в хранилище навсегда.
  await removePrevious(client, bucket, media.hls?.prefix ?? prefix, log);

  for (const file of result.files) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `${prefix}/${file.path}`,
        Body: file.body,
        ContentType: file.contentType,
        // Сегменты неизменны: их адрес меняется вместе с нарезкой, поэтому их
        // можно кешировать надолго. Плейлист — коротко, он может обновиться.
        CacheControl: file.path.endsWith('.m3u8')
          ? 'public, max-age=60'
          : 'public, max-age=31536000, immutable',
        ACL: 'public-read',
      }),
    );
  }
  log(`залито файлов: ${result.files.length}`);

  // Исходник удаляется после успешной нарезки. Смотрят через плейлист, а
  // оригинал остаётся мёртвым грузом: гигабайтный mp4 занимает больше места,
  // чем обе ступени вместе. Для закрытого видео это ещё и обязательное
  // условие — плагин заливает медиа с публичным доступом, и пока оригинал
  // в хранилище, защита сегментов ничего не решает.
  //
  // Удаляем только дойдя сюда: если нарезка упала, файл на месте и задачу
  // можно перезапустить.
  const sourceKey = sourceUrl.slice(String(process.env['S3_PUBLIC_URL'] ?? '').length + 1);
  if (sourceKey) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }));
    log(`исходник удалён, остаётся только нарезка: ${sourceKey}`);
  }

  const base = process.env['S3_PUBLIC_URL'] ?? '';
  await payload.update({
    collection: 'media',
    id: mediaId,
    data: {
      hls: {
        playlistUrl: `${base}/${prefix}/master.m3u8`,
        prefix,
        qualities: result.rungs.map((r) => ({ height: r.height })),
        durationSeconds: result.durationSeconds,
        status: 'ready',
        error: null,
        // Секрет хранится в базе и отдаётся только через эндпоинт, который
        // решает, кому можно. В раздачу он не попадает никогда.
        secret: result.secret.toString('base64'),
      },
    },
    // Видео не проходит через версии-черновики, но статус обновляем тихо:
    // это служебное поле, а не правка контента человеком.
    context: { skipHlsQueue: true },
  });

  return {
    qualities: result.rungs.map((r) => r.height),
    files: result.files.length,
    durationSeconds: result.durationSeconds,
  };
}

/**
 * Лесенка качеств из настроек сайта.
 *
 * @remarks
 * Владелец выбирает ступени сам, без разработчика. Битрейты остаются нашими:
 * это инженерный параметр, который нечего выносить в интерфейс — от него
 * зависит, будет ли картинка сыпаться на движении.
 */
async function ladderFrom(payload: Payload): Promise<ReadonlyArray<HlsRung>> {
  const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as {
    video?: { qualities?: ReadonlyArray<string> | null };
  };
  const chosen = settings?.video?.qualities;
  if (!chosen || chosen.length === 0) return DEFAULT_LADDER;

  const known = new Map<number, HlsRung>([
    [360, { height: 360, videoKbps: 700, audioKbps: 96 }],
    [480, { height: 480, videoKbps: 1200, audioKbps: 96 }],
    [720, { height: 720, videoKbps: 2800, audioKbps: 128 }],
    [1080, { height: 1080, videoKbps: 5000, audioKbps: 128 }],
  ]);

  const rungs = chosen
    .map((value) => known.get(Number(value)))
    .filter((rung): rung is HlsRung => Boolean(rung))
    // Снизу вверх: плеер стартует с нижней ступени, и первый кадр появляется
    // быстрее, чем при старте с верхней.
    .sort((a, b) => a.height - b.height);

  return rungs.length > 0 ? rungs : DEFAULT_LADDER;
}

/** Убирает прошлую нарезку: остатки старых сегментов ломают новый плейлист. */
async function removePrevious(
  client: S3Client,
  bucket: string,
  prefix: string,
  log: (m: string) => void,
): Promise<void> {
  let token: string | undefined;
  let removed = 0;
  do {
    const listed = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/`, ContinuationToken: token }),
    );
    const keys = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (keys.length > 0) {
      await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }));
      removed += keys.length;
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);
  if (removed > 0) log(`убрал прошлую нарезку: ${removed} файлов`);
}
