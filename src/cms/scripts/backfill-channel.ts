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

import config from '../src/payload.config';
import { channelFrom, freeChannel } from '../src/lib/channel';

const write = process.argv.includes('--apply');

const payload = await getPayload({ config, disableOnInit: true });
const req = { payload } as Parameters<typeof freeChannel>[0];

const people = await payload.find({
  collection: 'users',
  limit: 500,
  depth: 0,
  overrideAccess: true,
});
const without = (
  people.docs as Array<{
    id: string | number;
    channel?: string | null;
    name?: string | null;
    email?: string | null;
  }>
).filter((person) => !person.channel);

if (without.length === 0) {
  console.log('заводить нечего: адрес есть у всех');
  process.exit(0);
}

for (const person of without) {
  const address = await freeChannel(req, channelFrom(person.name, person.email));
  if (!write) {
    console.log(`будет заведён канал: ${person.name ?? person.email} → /@${address}`);
    continue;
  }
  await payload.update({
    collection: 'users',
    id: person.id,
    data: { channel: address },
    overrideAccess: true,
  });
  console.log(`заведён канал: ${person.name ?? person.email} → /@${address}`);
}

console.log(
  write
    ? `Заведено: ${without.length}.`
    : `Найдено без канала: ${without.length}. Повторите с --apply.`,
);
process.exit(0);
