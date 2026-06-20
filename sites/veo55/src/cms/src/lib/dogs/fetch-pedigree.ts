/**
 * fetch-pedigree — чистая функция импорта родословной из РКФ для всех Dogs
 * с заполненным `rkfId` (либо в `KNOWN_RKF_IDS` bootstrap-mapping'е).
 *
 * Вызывается из:
 *  1. CLI-сид `pnpm seed:fetch-pedigree` (`src/seed/seed-fetch-pedigree.ts`)
 *  2. Payload Jobs Task `fetch-pedigree` (`src/jobs/fetch-pedigree.task.ts`)
 *
 * Источник — `https://veo55.ru/dog-data.php?id={rkfId}` (legacy РКФ-парсер
 * нашего же сайта). F-этап: TS-порт `dog-data.php` напрямую в нашу LIB.
 */
import type { Payload } from 'payload';

/** Bootstrap mapping для существующих собак где rkfId ещё не проставлен. */
export const KNOWN_RKF_IDS: Record<string, number> = {
  nobelevskaya: 68712,
  'mars-ares': 65923,
};

interface RkfAncestor {
  id: number;
  name: string;
  note?: string;
}

interface RkfDogResponse {
  id: number;
  name: string;
  pedigree?: RkfAncestor[];
  error?: string;
}

export interface FetchPedigreeArgs {
  readonly payload: Payload;
  readonly logger?: (msg: string) => void;
}

export interface FetchPedigreeSummary {
  readonly updated: number;
  readonly skipped: number;
}

async function fetchOne(rkfId: number): Promise<RkfAncestor[] | null> {
  const url = `https://veo55.ru/dog-data.php?id=${rkfId}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'veo55-cms/1.0' } });
  if (!response.ok) return null;
  const data = (await response.json()) as RkfDogResponse;
  if (data.error) return null;
  return data.pedigree ?? null;
}

export async function fetchAllPedigrees(args: FetchPedigreeArgs): Promise<FetchPedigreeSummary> {
  const { payload } = args;
  const log = args.logger ?? ((m) => console.log(`[fetch-pedigree] ${m}`));
  const dogs = await payload.find({ collection: 'dogs', limit: 500, depth: 0 });

  let updated = 0;
  let skipped = 0;
  for (const dog of dogs.docs) {
    let rkfId = (dog as { rkfId?: number }).rkfId;
    if (!rkfId && KNOWN_RKF_IDS[dog.slug] !== undefined) {
      rkfId = KNOWN_RKF_IDS[dog.slug];
      log(`bootstrap rkfId=${rkfId} для slug=${dog.slug}`);
    }
    if (!rkfId) {
      skipped++;
      continue;
    }
    const rawPed = await fetchOne(rkfId);
    if (!rawPed || rawPed.length < 2) {
      skipped++;
      continue;
    }
    // pedigree[0] = сама собака, не сохраняем
    const pedigree = rawPed.slice(1).map((a, i) => ({
      position: i + 1,
      rkfId: a.id,
      name: a.name,
      note: a.note ?? null,
    }));
    await payload.update({
      collection: 'dogs',
      id: dog.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { rkfId, pedigree } as any,
      draft: false,
    });
    log(`OK slug=${dog.slug} rkfId=${rkfId} pedigree=${pedigree.length}`);
    updated++;
  }
  log(`done updated=${updated} skipped=${skipped}`);
  return { updated, skipped };
}
