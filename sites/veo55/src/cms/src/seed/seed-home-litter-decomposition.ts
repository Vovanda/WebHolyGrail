/**
 * seed-home-litter-decomposition — заменяет монолитный `litter-card` блок
 * на главной странице тремя атомарными:
 *   litter-header → litter-pair-card → litter-puppies
 * (порядок по умолчанию, который потом редактор может перетащить в админке).
 *
 * Идемпотентен: если `litter-card` отсутствует — пропускает.
 * Запуск: pnpm --filter veo55-cms seed:home-litter-decomposition
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

async function main() {
  console.log('[seed:home-litter-decomposition] starting…');
  const payload = await getPayload({ config });

  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });
  const home = homeResult.docs[0];
  if (!home) {
    console.error('[seed:home-litter-decomposition] home page не найдена');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = (home.blocks ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const litterIdx = blocks.findIndex((b: any) => b.blockType === 'litter-card');
  if (litterIdx < 0) {
    console.log('[seed:home-litter-decomposition] litter-card блок не найден — пропускаю.');
    process.exit(0);
  }

  const litterCard = blocks[litterIdx];
  const litter = litterCard.litter;
  const showSold = litterCard.showSold ?? false;

  const headerBlock = { blockType: 'litter-header', litter };
  const pairCardBlock = { blockType: 'litter-pair-card', litter };
  const puppiesBlock = { blockType: 'litter-puppies', litter, showSold };

  const newBlocks = [
    ...blocks.slice(0, litterIdx),
    headerBlock,
    pairCardBlock,
    puppiesBlock,
    ...blocks.slice(litterIdx + 1),
  ];

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { blocks: newBlocks, _status: 'published' } as never,
    draft: false,
  });

  console.log(
    `[seed:home-litter-decomposition] OK. litter-card[${litterIdx}] → header+pair-card+puppies.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:home-litter-decomposition] FAILED:', err);
  process.exit(1);
});
