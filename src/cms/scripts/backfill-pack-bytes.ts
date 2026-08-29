/**
 * Досчитывает вес нарезки у записей, разрезанных до появления подсчёта.
 *
 * @remarks
 * Вес нарезки складывается при разрезании из выданных кусков, и новым записям
 * он достаётся сам. У прежних его нет, и под именем стоит вес исходника,
 * которого в хранилище давно нет. Этот пробег обходит папку нарезки в хранилище
 * и складывает то, что там лежит.
 *
 * Обход стоит одного перечисления на запись, поэтому он разовый и в обычной
 * работе не участвует. Повторный запуск безопасен: записи с уже посчитанным
 * весом пропускаются.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms backfill:pack-bytes          # посмотреть, что будет сделано
 * pnpm --filter cms backfill:pack-bytes --apply  # записать
 * ```
 */
import payload from 'payload';

import config from '../src/payload.config';
import { s3Storage } from '../src/lib/media/adapters';

const apply = process.argv.includes('--apply');

async function main(): Promise<void> {
  await payload.init({ config });
  const storage = s3Storage();

  const found = await payload.find({
    collection: 'media',
    where: { 'hls.status': { equals: 'ready' } },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  });

  let counted = 0;
  let written = 0;

  for (const doc of found.docs) {
    const record = doc as {
      id: string | number;
      hls?: { prefix?: string | null; packBytes?: number | null };
    };
    if (record.hls?.packBytes) continue;

    const prefix = record.hls?.prefix;
    if (!prefix) {
      console.log(`адреса нарезки нет: запись ${record.id}`);
      continue;
    }

    const bytes = await storage.folderBytes(prefix);
    if (bytes === 0) {
      console.log(`в хранилище пусто: запись ${record.id} (${prefix})`);
      continue;
    }

    counted += 1;
    if (!apply) {
      console.log(`будет записан вес нарезки: запись ${record.id} — ${bytes} байт`);
      continue;
    }

    await payload.update({
      collection: 'media',
      id: record.id,
      data: { hls: { packBytes: bytes } },
      // Служебное обновление: иначе запись ушла бы на новый круг нарезки.
      context: { skipHlsQueue: true },
      overrideAccess: true,
    });
    written += 1;
    console.log(`записан вес нарезки: запись ${record.id} — ${bytes} байт`);
  }

  if (counted === 0) console.log('Записей без веса нарезки нет: считать нечего.');
  else if (!apply)
    console.log(`Найдено без веса: ${counted}. Повторите с --apply, чтобы записать.`);
  else console.log(`Записано: ${written} из ${counted}.`);

  process.exit(0);
}

void main();
