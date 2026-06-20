/**
 * seed-timeline-paws — добавляет иконку 🐾 entries Timeline'а на главной
 * для лет без иконки (изначально 2019 и 2008).
 *
 * Запуск: pnpm --filter veo55-cms seed:timeline-paws
 * Идемпотентен: пропускает entries у которых icon уже стоит.
 *
 * Архитектура: Payload Local API (как seed-home-achievement).
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

const PAW = '🐾';

async function main() {
  console.log('[seed:timeline-paws] starting…');
  const payload = await getPayload({ config });

  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });
  const home = homeResult.docs[0];
  if (!home) {
    console.error('[seed:timeline-paws] home page не найдена');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = (home.blocks ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineIdx = blocks.findIndex((b: any) => b.blockType === 'timeline');
  if (timelineIdx < 0) {
    console.error('[seed:timeline-paws] timeline блок не найден на главной');
    process.exit(1);
  }
  const timeline = blocks[timelineIdx];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (timeline.entries ?? []) as any[];

  let touched = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newEntries = entries.map((e: any) => {
    if (!e.icon) {
      touched++;
      return { ...e, icon: PAW };
    }
    return e;
  });

  if (touched === 0) {
    console.log('[seed:timeline-paws] все entries уже имеют icon — пропускаю.');
    process.exit(0);
  }

  const newBlocks = [
    ...blocks.slice(0, timelineIdx),
    { ...timeline, entries: newEntries },
    ...blocks.slice(timelineIdx + 1),
  ];

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { blocks: newBlocks, _status: 'published' } as never,
    draft: false,
  });

  console.log(`[seed:timeline-paws] OK. Поставил 🐾 на ${touched} entries.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:timeline-paws] FAILED:', err);
  process.exit(1);
});
