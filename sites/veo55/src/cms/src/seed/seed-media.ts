/**
 * seed-media — скачивает файлы с CDN и загружает в Payload Media через Local API.
 *
 * Запуск: pnpm --filter veo55-cms seed:media
 * Идемпотентен: если файл с таким именем уже есть — пропускает.
 */
import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../payload.config';

const FILES: { url: string; filename: string; alt: string }[] = [
  {
    url: 'https://cdn.veo55.ru/headers/banner1%20.png',
    filename: 'banner1.png',
    alt: 'Питомник ВЕО «Омская Дружина»',
  },
  {
    url: 'https://cdn.veo55.ru/headers/banner2.png',
    filename: 'banner2.png',
    alt: 'Щенки восточноевропейской овчарки с документами РКФ',
  },
  {
    url: 'https://cdn.veo55.ru/images/about/olga-1.jpg',
    filename: 'olga-1.jpg',
    alt: 'Ольга Савкина, питомник Омская Дружина',
  },
  {
    url: 'https://cdn.veo55.ru/images/about/olga-2.jpg',
    filename: 'olga-2.jpg',
    alt: 'Ольга Савкина',
  },
  {
    url: 'https://cdn.veo55.ru/images/about/olga-3.jpg',
    filename: 'olga-3.jpg',
    alt: 'Ольга Савкина',
  },
  {
    url: 'https://cdn.veo55.ru/images/about/olga-4.jpg',
    filename: 'olga-4.jpg',
    alt: 'Ольга Савкина',
  },
  {
    url: 'https://cdn.veo55.ru/images/about/olga-5.jpg',
    filename: 'olga-5.jpg',
    alt: 'Ольга Савкина',
  },
  {
    url: 'https://cdn.veo55.ru/images/about/olga-6.jpg',
    filename: 'olga-6.jpg',
    alt: 'Ольга Савкина',
  },
];

async function main() {
  console.log('[seed:media] starting…');
  const payload = await getPayload({ config });

  for (const { url, filename, alt } of FILES) {
    // Проверить не загружен ли уже
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      console.log(`[seed:media]   skip (exists): ${filename}`);
      continue;
    }

    console.log(`[seed:media]   fetching: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[seed:media]   FAIL ${res.status}: ${url}`);
      continue;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get('content-type') ?? 'image/jpeg';

    await payload.create({
      collection: 'media',
      data: { alt },
      file: {
        data: buffer,
        mimetype: mimeType,
        name: filename,
        size: buffer.length,
      },
    });
    console.log(`[seed:media]   uploaded: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
  }

  console.log('[seed:media] done.');
  process.exit(0);
}

main().catch((e) => {
  console.error('[seed:media] failed:', e);
  process.exit(1);
});
