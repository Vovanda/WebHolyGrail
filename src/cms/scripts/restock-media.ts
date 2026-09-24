/**
 * Пересобирает копии и заготовку у файлов, залитых раньше.
 *
 * @remarks
 * Нарезка задаётся коллекцией и применяется в момент заливки. Всё, что залито
 * до правок, так и осталось с прежним набором: копии в jpeg при webp-оригинале,
 * ступеней 1200 и 2560 нет вовсе, заготовки кадра нет. Показ из-за этого берёт
 * вариант крупнее нужного или тянет оригинал целиком.
 *
 * Пробег скачивает файл, отдаёт его обратно тем же именем и даёт CMS пересобрать
 * производные по нынешнему списку ступеней. Заготовка и яркость снимаются теми же
 * хуками, что и при обычной заливке, - отдельного пути для них не заводится.
 *
 * Имя файла не меняется, поэтому ссылки на страницах остаются прежними: записи
 * ссылаются на документ, а адрес собирается из имени.
 *
 * Идёт по одному файлу. Битый или недоступный пропускается с пояснением: один
 * сломанный файл не должен ронять весь пробег.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms restock:media          # посмотреть, что будет сделано
 * pnpm --filter cms restock:media --apply  # пересобрать
 * pnpm --filter cms restock:media --apply --force  # включая те, что уже полны
 * ```
 */
import payload from 'payload';
import { MEDIA_RENDITIONS } from 'contracts';

import config from '../src/payload.config';

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');

interface MediaDoc {
  readonly id: string | number;
  readonly filename?: string | null;
  readonly mimeType?: string | null;
  readonly url?: string | null;
  readonly width?: number | null;
  readonly blurData?: string | null;
  readonly sizes?: Record<string, { url?: string | null } | undefined> | null;
}

/**
 * Чего файлу не хватает по нынешним правилам.
 *
 * @remarks
 * Ступень крупнее самого файла не считается пропажей: CMS не растягивает
 * снимок ради вывески, и у кадра шириной в девятьсот точек ступеней на 1200
 * и 2560 не будет никогда. Требовать их - значит гонять пересборку по кругу.
 */
function missing(doc: MediaDoc): string[] {
  const gaps: string[] = [];
  if (!doc.blurData) gaps.push('заготовка');

  const sizes = doc.sizes ?? {};
  const own = doc.width ?? 0;
  const absent = MEDIA_RENDITIONS.filter(
    ({ name, width }) => (!own || width <= own) && !sizes[name]?.url,
  ).map(({ name }) => name);
  if (absent.length > 0) gaps.push(`ступени ${absent.join(', ')}`);

  const jpeg = Object.values(sizes).filter((size) => /\.(jpe?g|png)(\?|$)/i.test(size?.url ?? ''));
  if (jpeg.length > 0) gaps.push(`копии не в webp: ${jpeg.length}`);

  return gaps;
}

/**
 * Полный адрес файла.
 *
 * @remarks
 * У документа адрес бывает относительным - так его отдаёт своя раздача. Внешнее
 * хранилище отдаёт полный, и тогда дописывать нечего.
 */
function fullUrl(doc: MediaDoc, base: string): string | null {
  const url = doc.url;
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function main(): Promise<void> {
  await payload.init({ config });

  const base = (process.env['NEXT_PUBLIC_CMS_URL'] ?? 'http://localhost:3001').replace(/\/+$/, '');
  const found = await payload.find({
    collection: 'media',
    where: { mimeType: { like: 'image/' } },
    limit: 0,
    depth: 0,
    pagination: false,
  });

  const docs = found.docs as unknown as MediaDoc[];
  payload.logger.info(`Картинок в медиатеке: ${docs.length}`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const gaps = missing(doc);
    if (gaps.length === 0 && !force) {
      skipped += 1;
      continue;
    }

    const name = doc.filename ?? String(doc.id);
    const url = fullUrl(doc, base);
    if (!url) {
      payload.logger.warn(`${name}: адреса нет, пропуск`);
      failed += 1;
      continue;
    }

    if (!apply) {
      payload.logger.info(`${name}: ${gaps.join('; ') || 'полный, но будет пересобран'}`);
      done += 1;
      continue;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`хранилище ответило ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());

      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: {
          data,
          mimetype: doc.mimeType ?? 'image/jpeg',
          name,
          size: data.byteLength,
        },
        overrideAccess: true,
      });
      payload.logger.info(`${name}: пересобран (${gaps.join('; ') || 'принудительно'})`);
      done += 1;
    } catch (error) {
      payload.logger.warn(`${name}: ${(error as Error).message}`);
      failed += 1;
    }
  }

  payload.logger.info(
    apply
      ? `Пересобрано: ${done}, пропущено как полные: ${skipped}, не вышло: ${failed}`
      : `К пересборке: ${done}, полных: ${skipped}, без адреса: ${failed}. Запусти с --apply`,
  );
  process.exit(0);
}

void main();
