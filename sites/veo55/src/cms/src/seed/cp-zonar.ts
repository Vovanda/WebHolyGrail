/**
 * Одноразовый скрипт: скопировать на S3 свежее фото зонарной девочки из
 * legacy-префикса в наш `media/` префикс.
 *
 * Зачем: Володя залил новую версию фото на S3 под legacy-путь
 * `images/14-04-26/zonarnaya-devochka-01.jpg` (там лежат фотки legacy-сайта),
 * а наш Payload Media-2 ссылается на `media/zonarnaya-devochka-1.webp`.
 * Эти два разных key в одном bucket. Нужно положить новое фото на наш key.
 *
 * `S3CopyObjectCommand` копирует внутри bucket без скачивания на хост.
 * После копии — touch Media-2 в Payload (PATCH alt с тем же значением)
 * чтобы `updatedAt` обновился → `?v=` busting → CDN отдаёт новый файл.
 *
 * Запуск: `pnpm exec tsx src/seed/cp-zonar.ts` из `sites/veo55/src/cms/`.
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

// @aws-sdk/client-s3 затянут в pnpm store как transitive через @payloadcms/storage-s3,
// прямого hoisted симлинка в cms/node_modules нет. Импортируем напрямую из pnpm-пути.
const { S3Client, CopyObjectCommand, HeadObjectCommand } =
  await import('../../../../../../node_modules/.pnpm/@aws-sdk+client-s3@3.1072.0/node_modules/@aws-sdk/client-s3/dist-cjs/index.js');

const BUCKET = process.env.S3_BUCKET ?? 'veo55';
const SRC_KEY = 'images/14-04-26/zonarnaya-devochka-01.jpg';
const DST_KEY = 'media/zonarnaya-devochka-1.webp';

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'ru-msk',
  endpoint: process.env.S3_ENDPOINT ?? 'https://hb.ru-msk.vkcloud-storage.ru',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
});

async function main() {
  console.log(`[cp-zonar] HEAD src s3://${BUCKET}/${SRC_KEY}`);
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: SRC_KEY }));
  console.log(
    `[cp-zonar] src exists: Last-Modified=${head.LastModified?.toISOString()} size=${head.ContentLength}`,
  );

  console.log(`[cp-zonar] COPY → s3://${BUCKET}/${DST_KEY}`);
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: DST_KEY,
      CopySource: `/${BUCKET}/${SRC_KEY}`,
      ACL: 'public-read',
      MetadataDirective: 'REPLACE',
      // Перебиваем content-type: на src jpg, dst — наш webp-key. CDN отдаст
      // image/jpeg всё равно, файл там по факту jpg. Браузеры читают по content-type,
      // не по расширению — расхождение допустимо. Если важно ровно webp — нужна
      // конвертация (sharp) что выходит за рамки одноразового cp.
      ContentType: head.ContentType ?? 'image/jpeg',
    }),
  );
  console.log('[cp-zonar] dst copied');

  const dstHead = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: DST_KEY }));
  console.log(
    `[cp-zonar] dst now: Last-Modified=${dstHead.LastModified?.toISOString()} size=${dstHead.ContentLength}`,
  );
  console.log(
    '[cp-zonar] OK. Теперь touch Media-2 в Payload (PATCH alt) → CDN bust через ?v=updatedAt.',
  );
}

main().catch((e) => {
  console.error('[cp-zonar] FAIL:', e);
  process.exit(1);
});
