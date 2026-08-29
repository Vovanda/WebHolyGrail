/**
 * Заполняет адрес кадра у записей, заведённых до появления этого поля.
 *
 * @remarks
 * Кадр лежит отдельной записью, и связь на него хранит только номер. Список
 * Payload грузит записи без вложенности, поэтому по связи адрес там не достать,
 * и миниатюра в списке остаётся пустой. Адрес поэтому дублируется рядом
 * с записью; новые записи получают его сразу при снятии кадра, а уже
 * заведённым его дописывает этот пробег.
 *
 * Ничего не создаёт и не удаляет: только переносит адрес из связанной записи
 * в поле рядом. Повторный запуск безопасен - записи с заполненным полем
 * пропускаются.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms backfill:preview-url          # посмотреть, что будет сделано
 * pnpm --filter cms backfill:preview-url --apply  # записать
 * ```
 */
import payload from 'payload';

import config from '../src/payload.config';

const apply = process.argv.includes('--apply');

type Related = { url?: string | null } | number | string | null | undefined;

function urlOf(preview: Related): string | undefined {
  if (typeof preview === 'object' && preview !== null && typeof preview.url === 'string') {
    return preview.url;
  }
  return undefined;
}

async function main(): Promise<void> {
  await payload.init({ config });

  // Глубина в единицу нужна ровно здесь: адрес берётся из связанной записи,
  // а дальше он уже лежит рядом и дозапроса не требует.
  const found = await payload.find({
    collection: 'media',
    where: { preview: { exists: true } },
    depth: 1,
    limit: 1000,
    overrideAccess: true,
  });

  let missing = 0;
  let filled = 0;

  for (const doc of found.docs) {
    const record = doc as { id: string | number; previewUrl?: string | null; preview?: Related };
    if (record.previewUrl) continue;

    const url = urlOf(record.preview);
    if (!url) {
      console.log(`адреса кадра нет: запись ${record.id}`);
      continue;
    }

    missing += 1;
    if (!apply) {
      console.log(`будет записан адрес кадра: запись ${record.id}`);
      continue;
    }

    await payload.update({
      collection: 'media',
      id: record.id,
      data: { previewUrl: url },
      // Служебное обновление: иначе запись ушла бы на новый круг нарезки.
      context: { skipHlsQueue: true },
      overrideAccess: true,
    });
    filled += 1;
    console.log(`записан адрес кадра: запись ${record.id}`);
  }

  if (missing === 0) console.log('Пустых адресов нет: дописывать нечего.');
  else if (!apply) console.log(`Найдено пустых: ${missing}. Повторите с --apply, чтобы записать.`);
  else console.log(`Записано: ${filled} из ${missing}.`);

  process.exit(0);
}

void main();
