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

const писать = process.argv.includes('--apply');

const бакет = process.env['S3_BUCKET'];
const адрес = process.env['S3_ENDPOINT'];
const область = process.env['S3_REGION'];
const ключ = process.env['S3_ACCESS_KEY_ID'];
const секрет = process.env['S3_SECRET_ACCESS_KEY'];

if (!бакет || !адрес || !ключ || !секрет) {
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
const источники = Array.from(
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

const клиент = new S3Client({
  region: область ?? 'us-east-1',
  endpoint: адрес,
  forcePathStyle: true,
  credentials: { accessKeyId: ключ, secretAccessKey: секрет },
});

const текущее = await клиент
  .send(new GetBucketCorsCommand({ Bucket: бакет }))
  .then((r) => r.CORSRules ?? [])
  .catch(() => null);

console.log('сейчас в хранилище:', текущее ? JSON.stringify(текущее) : 'разрешения нет');
console.log('выдаём источникам:', источники.join(', '));

if (!писать) {
  console.log('Показ без записи. Повторите с --apply.');
  process.exit(0);
}

await клиент.send(
  new PutBucketCorsCommand({
    Bucket: бакет,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: источники,
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
