/**
 * seed-home-fix-litter — одноразовый фикс: восстанавливает 3 атомарных
 * litter-* блока на главной странице после потери при переключении
 * Payload-схемы.
 *
 * Идемпотентен: если на главной уже есть хотя бы один litter-блок —
 * пропускает.
 *
 * Запуск: pnpm --filter veo55-cms seed:home-fix-litter
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

async function main() {
  console.log('[seed:home-fix-litter] starting…');
  const payload = await getPayload({ config });

  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });
  const home = homeResult.docs[0];
  if (!home) {
    console.error('home page не найдена');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = (home.blocks ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasLitter = blocks.some((b: any) =>
    ['litter-header', 'litter-pair-card', 'litter-puppies', 'litter-card'].includes(b.blockType),
  );
  if (hasLitter) {
    console.log('[seed:home-fix-litter] на главной уже есть litter-блок — пропускаю.');
    process.exit(0);
  }

  // Найти litter id=3 (активный помёт «Литера Н»).
  const litterResult = await payload.find({
    collection: 'litters',
    where: { status: { equals: 'active' } },
    limit: 1,
    sort: '-dob',
    depth: 0,
  });
  const litter = litterResult.docs[0];
  if (!litter) {
    console.error('активный помёт не найден');
    process.exit(1);
  }

  // Вставка после hero (если есть) или в конец.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heroIdx = blocks.findIndex((b: any) => b.blockType === 'hero');
  const insertAt = heroIdx >= 0 ? heroIdx + 1 : blocks.length;

  const newBlocks = [
    ...blocks.slice(0, insertAt),
    { blockType: 'litter-header', litter: litter.id },
    { blockType: 'litter-pair-card', litter: litter.id },
    { blockType: 'litter-puppies', litter: litter.id, showSold: false },
    ...blocks.slice(insertAt),
  ];

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { blocks: newBlocks, _status: 'published' } as never,
    draft: false,
  });

  console.log(
    `[seed:home-fix-litter] OK. 3 litter-блока вставлены на позицию [${insertAt}] (помёт id=${litter.id}).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:home-fix-litter] FAILED:', err);
  process.exit(1);
});
