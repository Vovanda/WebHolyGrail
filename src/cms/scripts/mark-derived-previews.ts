/**
 * Помечает служебными кадры, созданные до того, как признак стали ставить.
 *
 * @remarks
 * Кадр видео получает признак служебного при снятии и в общий список медиа
 * не попадает. Кадр первой страницы документа его раньше не получал, поэтому
 * такие записи видны в медиатеке наравне с содержимым, и владелец сайта видит
 * рядом со своими файлами служебные картинки.
 *
 * Пробег ничего не создаёт и не удаляет: ставит признак тем записям в папке
 * кадров, у которых его нет. Повторный запуск безопасен.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms mark:derived-previews          # посмотреть, что будет сделано
 * pnpm --filter cms mark:derived-previews --apply  # пометить
 * ```
 */
import payload from 'payload';

import config from '../src/payload.config';
import { POSTER_PREFIX } from '../src/collections/Media';

const apply = process.argv.includes('--apply');

async function main(): Promise<void> {
  await payload.init({ config });

  const found = await payload.find({
    collection: 'media',
    where: {
      prefix: { equals: POSTER_PREFIX },
      or: [{ derived: { equals: false } }, { derived: { exists: false } }],
    },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  });

  if (found.docs.length === 0) {
    console.log('Непомеченных кадров нет: помечать нечего.');
    process.exit(0);
  }

  let marked = 0;
  for (const doc of found.docs) {
    const record = doc as { id: string | number; filename?: string | null };
    if (!apply) {
      console.log(`будет помечен служебным: ${record.filename ?? record.id}`);
      continue;
    }

    await payload.update({
      collection: 'media',
      id: record.id,
      data: { derived: true },
      // Служебное обновление: иначе запись ушла бы на новый круг нарезки.
      context: { skipHlsQueue: true },
      overrideAccess: true,
    });
    marked += 1;
    console.log(`помечен служебным: ${record.filename ?? record.id}`);
  }

  if (!apply) {
    console.log(`Найдено непомеченных: ${found.docs.length}. Повторите с --apply, чтобы пометить.`);
  } else {
    console.log(`Помечено: ${marked} из ${found.docs.length}.`);
  }

  process.exit(0);
}

void main();
