/**
 * seed-rebuild-litter-page-slug — обновляет slug всех Pages-записей,
 * созданных для помётов через кнопку «Создать страницу», на новый формат
 * `puppies/<dob>/<letter>`.
 *
 * Старые форматы которые ищет: `litera-*` или `puppies/litera-*`.
 * Идемпотентен.
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

async function main() {
  console.log('[seed:rebuild-litter-page-slug] starting…');
  const payload = await getPayload({ config });

  const litters = await payload.find({ collection: 'litters', limit: 200, depth: 0 });

  let touched = 0;
  for (const litter of litters.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dob = (litter as any).dob as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const letter = (litter as any).letter as string | undefined;
    if (!dob || !letter) continue;
    const dobIso = dob.slice(0, 10);
    const newSlug = `puppies/${dobIso}/${letter}`;

    // Ищем кастомную страницу для этого помёта по старым форматам.
    const candidates = await payload.find({
      collection: 'pages',
      where: {
        or: [
          { slug: { equals: `litera-${letter}-${dobIso.slice(0, 4)}` } },
          { slug: { equals: `puppies/litera-${letter}-${dobIso.slice(0, 4)}` } },
        ],
      },
      limit: 1,
      depth: 0,
    });
    const page = candidates.docs[0];
    if (!page) continue;
    if (page.slug === newSlug) continue;

    await payload.update({
      collection: 'pages',
      id: page.id,
      data: { slug: newSlug, _status: 'published' } as never,
      draft: false,
    });
    console.log(`  · litter ${litter.id}: ${page.slug} → ${newSlug}`);
    touched++;
  }

  console.log(`[seed:rebuild-litter-page-slug] OK. updated ${touched}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:rebuild-litter-page-slug] FAILED:', err);
  process.exit(1);
});
