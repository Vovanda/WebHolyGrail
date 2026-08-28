/**
 * Заворачивает секреты записей, оставшиеся в базе открытым текстом.
 *
 * @remarks
 * Записи, нарезанные до появления мастер-ключа, хранят секрет как есть. Дамп
 * такой базы равен ключам от всего закрытого, поэтому их нужно завернуть.
 *
 * Само видео при этом не трогается: меняется только то, как секрет лежит в
 * базе. Тот же приём годится и для смены мастер-ключа.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms rewrap:secrets          # посмотреть, что будет сделано
 * pnpm --filter cms rewrap:secrets --apply  # завернуть
 * ```
 */
import payload from 'payload';

import config from '../src/payload.config';
import { isWrapped, masterKey, wrapSecret } from '../src/lib/video/key-vault';

const apply = process.argv.includes('--apply');

async function main(): Promise<void> {
  const key = masterKey();
  if (!key) {
    console.error('Мастер-ключ не задан: заворачивать нечем. Проверьте VIDEO_MASTER_KEY.');
    process.exit(1);
  }

  await payload.init({ config });

  const found = await payload.find({
    collection: 'media',
    where: { 'hls.secret': { exists: true } },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  });

  let open = 0;
  let wrapped = 0;

  for (const doc of found.docs) {
    const record = doc as { id: string | number; hls?: { secret?: string | null } };
    const secret = record.hls?.secret;
    if (!secret || isWrapped(secret)) continue;

    open += 1;
    if (!apply) {
      console.log(`открытым текстом: запись ${record.id}`);
      continue;
    }

    await payload.update({
      collection: 'media',
      id: record.id,
      data: { hls: { secret: wrapSecret(Buffer.from(secret, 'base64'), key) } },
      // Служебное обновление: иначе запись ушла бы на новый круг нарезки.
      context: { skipHlsQueue: true },
      overrideAccess: true,
    });
    wrapped += 1;
    console.log(`завёрнут секрет записи ${record.id}`);
  }

  if (open === 0) console.log('Открытых секретов нет: заворачивать нечего.');
  else if (!apply) console.log(`Найдено открытых: ${open}. Повторите с --apply, чтобы завернуть.`);
  else console.log(`Завёрнуто: ${wrapped} из ${open}.`);

  process.exit(0);
}

void main();
