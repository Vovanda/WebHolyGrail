/**
 * Заводит адрес канала участникам, у которых его нет.
 *
 * @remarks
 * Адрес проставлялся только при заведении учётной записи, поэтому у тех, кто
 * заведён раньше самого поля, канала не было вовсе: страница отвечала «не
 * найдено», хотя запись лежала общедоступной.
 *
 * Ничего не переписывает: участники с заданным адресом пропускаются, а ссылки,
 * которые уже разошлись, остаются рабочими. Повторный запуск безопасен.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms backfill:channel          # посмотреть, что будет сделано
 * pnpm --filter cms backfill:channel --apply  # завести
 * ```
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.js';
import { channelFrom, freeChannel } from '../src/lib/channel.js';

const писать = process.argv.includes('--apply');

const payload = await getPayload({ config, disableOnInit: true });
const req = { payload } as Parameters<typeof freeChannel>[0];

const люди = await payload.find({
  collection: 'users',
  limit: 500,
  depth: 0,
  overrideAccess: true,
});
const без = (
  люди.docs as Array<{
    id: string | number;
    channel?: string | null;
    name?: string | null;
    email?: string | null;
  }>
).filter((человек) => !человек.channel);

if (без.length === 0) {
  console.log('заводить нечего: адрес есть у всех');
  process.exit(0);
}

for (const человек of без) {
  const адрес = await freeChannel(req, channelFrom(человек.name, человек.email));
  if (!писать) {
    console.log(`будет заведён канал: ${человек.name ?? человек.email} → /@${адрес}`);
    continue;
  }
  await payload.update({
    collection: 'users',
    id: человек.id,
    data: { channel: адрес },
    overrideAccess: true,
  });
  console.log(`заведён канал: ${человек.name ?? человек.email} → /@${адрес}`);
}

console.log(
  писать ? `Заведено: ${без.length}.` : `Найдено без канала: ${без.length}. Повторите с --apply.`,
);
process.exit(0);
