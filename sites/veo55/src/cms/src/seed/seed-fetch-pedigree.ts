/**
 * seed-fetch-pedigree — подкачивает родословную из РКФ для всех наших Dogs
 * с заполненным `rkfId` и сохраняет в `Dogs.pedigree[]`.
 *
 * Источник — `https://veo55.ru/dog-data.php?id={rkfId}` (наш legacy-парсер
 * РКФ; см. `.tmp/legacy/dog-helpers.php → veo_parse_dog`).
 * Формат ответа `{id, name, photos, info, father, mother, pedigree[]}` —
 * `pedigree[0]` это сама собака, `[1..14]` — предки по heap-layout (см.
 * JSDoc на `DogDoc.pedigree`).
 *
 * Для существующих собак, если `rkfId` ещё не проставлен — берёт его из
 * `KNOWN_RKF_IDS` (slug → rkfId). Это разовый bootstrap, в дальнейшем
 * заводчик ставит `rkfId` в админке при создании Dog.
 *
 * Идемпотентен: перезаписывает `pedigree[]` целиком (родословная не
 * меняется, кроме случаев когда РКФ дополнит данные).
 *
 * Запуск: pnpm --filter veo55-cms seed:fetch-pedigree
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

/**
 * Известные РКФ-id текущих собак питомника. Bootstrap: первая прогонка
 * проставляет rkfId в Payload, чтобы не зашивать его повторно.
 */
const KNOWN_RKF_IDS: Record<string, number> = {
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

async function fetchPedigree(rkfId: number): Promise<RkfAncestor[] | null> {
  const url = `https://veo55.ru/dog-data.php?id=${rkfId}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'veo55-cms-seed/1.0' },
  });
  if (!response.ok) {
    console.error(`[seed:fetch-pedigree] HTTP ${response.status} для rkfId=${rkfId}`);
    return null;
  }
  const data = (await response.json()) as RkfDogResponse;
  if (data.error) {
    console.error(`[seed:fetch-pedigree] РКФ ошибка для rkfId=${rkfId}: ${data.error}`);
    return null;
  }
  return data.pedigree ?? null;
}

async function main() {
  console.log('[seed:fetch-pedigree] starting…');
  const payload = await getPayload({ config });

  const dogs = await payload.find({
    collection: 'dogs',
    limit: 500,
    depth: 0,
  });

  let updated = 0;
  let skipped = 0;

  for (const dog of dogs.docs) {
    let rkfId = (dog as { rkfId?: number }).rkfId;
    if (!rkfId && KNOWN_RKF_IDS[dog.slug] !== undefined) {
      rkfId = KNOWN_RKF_IDS[dog.slug];
      console.log(`[seed:fetch-pedigree] bootstrap rkfId=${rkfId} для slug=${dog.slug}`);
    }
    if (!rkfId) {
      console.log(`[seed:fetch-pedigree] skip slug=${dog.slug} — нет rkfId.`);
      skipped++;
      continue;
    }

    const rawPed = await fetchPedigree(rkfId);
    if (!rawPed || rawPed.length < 2) {
      console.warn(`[seed:fetch-pedigree] пустая или невалидная родословная для rkfId=${rkfId}.`);
      skipped++;
      continue;
    }

    // pedigree[0] — сама собака, не сохраняем (см. JSDoc на DogDoc.pedigree).
    const pedigree = rawPed.slice(1).map((a, i) => ({
      position: i + 1,
      rkfId: a.id,
      name: a.name,
      note: a.note ?? null,
    }));

    await payload.update({
      collection: 'dogs',
      id: dog.id,
      data: {
        rkfId,
        pedigree,
      } as never,
      draft: false,
    });
    console.log(
      `[seed:fetch-pedigree] OK slug=${dog.slug} rkfId=${rkfId} pedigree=${pedigree.length}.`,
    );
    updated++;
  }

  console.log(`[seed:fetch-pedigree] done. updated=${updated} skipped=${skipped}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:fetch-pedigree] FAILED:', err);
  process.exit(1);
});
