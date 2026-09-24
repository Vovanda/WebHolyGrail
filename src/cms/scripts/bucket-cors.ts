/**
 * Разрешает сайту читать свои файлы из хранилища.
 *
 * @remarks
 * Плеер запрашивает кадр и саму нарезку с пометкой стороннего источника - иначе
 * он не может читать содержимое потока. Браузер на такой запрос требует у
 * хранилища разрешение, и без него кадр не рисуется вовсе: на месте картинки
 * остаётся значок битого файла, а в консоли - отказ по правилам источника.
 *
 * Поймано 31.08.2026 на veo55: у витрины разрешение стояло, у сайта - нет,
 * и владелец увидел чёрный прямоугольник вместо кадра.
 *
 * Разрешение выдаётся своим адресам, а не всем подряд: файлы отдаёт раздача,
 * и открытый список источников означал бы, что чужая страница может показывать
 * их у себя как свои.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms s3:cors          # показать, что стоит сейчас
 * pnpm --filter cms s3:cors --apply  # выставить
 * ```
 */
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

const write = process.argv.includes('--apply');

const bucket = process.env['S3_BUCKET'];
const endpoint = process.env['S3_ENDPOINT'];
const region = process.env['S3_REGION'];
const accessKey = process.env['S3_ACCESS_KEY_ID'];
const secretKey = process.env['S3_SECRET_ACCESS_KEY'];

if (!bucket || !endpoint || !accessKey || !secretKey) {
  console.error('Нет настроек хранилища: нужны S3_BUCKET, S3_ENDPOINT, ключ и секрет.');
  process.exit(1);
}

/**
 * Чьи страницы имеют право показывать файлы сайта.
 *
 * @remarks
 * Свой домен и его вариант с www, плюс адрес показа, если он задан отдельно.
 * Местные адреса стенда - чтобы кадр был виден и при разработке.
 */
const origins = Array.from(
  new Set(
    [
      process.env['NEXT_PUBLIC_SITE_URL'],
      process.env['PAYLOAD_PUBLIC_SERVER_URL'],
      ...String(process.env['PAYLOAD_ALLOWED_ORIGINS'] ?? '')
        .split(',')
        .map((s) => s.trim()),
      'http://localhost:3000',
      'http://localhost:3001',
    ]
      .filter((s): s is string => Boolean(s))
      .map((s) => s.replace(/\/$/, '')),
  ),
);

const client = new S3Client({
  region: region ?? 'us-east-1',
  endpoint: endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

const current = await client
  .send(new GetBucketCorsCommand({ Bucket: bucket }))
  .then((r) => r.CORSRules ?? [])
  .catch(() => null);

console.log('сейчас в хранилище:', current ? JSON.stringify(current) : 'разрешения нет');
console.log('выдаём источникам:', origins.join(', '));

if (!write) {
  console.log('Показ без записи. Повторите с --apply.');
  process.exit(0);
}

await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          // Только чтение: записывает в хранилище сам сайт, ключами, а не страница.
          AllowedMethods: ['GET', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposeHeaders: [
            'Content-Length',
            'Content-Type',
            'ETag',
            'Accept-Ranges',
            'Content-Range',
          ],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.log('разрешение выставлено');
process.exit(0);
