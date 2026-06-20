/**
 * seed-trim-litter-titles — одноразовый: убирает ведущие/хвостовые пробелы
 * в `title` всех помётов.
 *
 * Идемпотентен: если все title чистые — ничего не делает.
 *
 * Запуск: pnpm --filter veo55-cms seed:trim-litter-titles
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

async function main() {
  console.log('[seed:trim-litter-titles] starting…');
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: 'litters',
    limit: 100,
    depth: 0,
  });

  let touched = 0;
  for (const doc of result.docs) {
    const trimmed = doc.title?.trim() ?? '';
    if (trimmed === doc.title) continue;
    await payload.update({
      collection: 'litters',
      id: doc.id,
      data: { title: trimmed } as never,
    });
    touched++;
    console.log(`  · ${doc.id}: "${doc.title}" → "${trimmed}"`);
  }

  console.log(`[seed:trim-litter-titles] OK. trimmed ${touched} title(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:trim-litter-titles] FAILED:', err);
  process.exit(1);
});
