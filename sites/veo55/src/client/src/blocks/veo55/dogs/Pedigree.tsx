import type { BlockNode, DogDoc, SiteSettings } from '@veo55/contracts';

import { getDogById } from '@/lib/api-client';
import { PedigreeTree } from '@/blocks/primitives/PedigreeTree';

/**
 * Pedigree-блок — Payload-обёртка над `PedigreeTree`. Тянет `DogDoc` по
 * `data.dog` через Local API и пробрасывает `pedigree[]` + `rkfId` в общий
 * презентационный компонент.
 *
 * @remarks
 * **R3 + R9.** Презентация выделена в `primitives/PedigreeTree` — этот блок
 * только источник данных (наша БД Dogs). РКФ-карточка `/catalog?dog=N`
 * использует `PedigreeTree` напрямую (там данные из RKF-парсера, не Payload).
 *
 * Server Component (R14).
 */
export interface PedigreeData {
  readonly dog?: string | DogDoc;
  readonly title?: string;
}

export async function Pedigree({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<PedigreeData> };
  readonly settings: SiteSettings;
}) {
  const dogRef = node.data?.dog;
  const dogId: string | null =
    typeof dogRef === 'string'
      ? dogRef
      : typeof dogRef === 'number'
        ? String(dogRef)
        : dogRef && typeof dogRef === 'object'
          ? String((dogRef as { id?: string | number }).id ?? '')
          : null;
  const dog: DogDoc | null = dogId ? await getDogById(dogId) : null;

  if (!dog) {
    return process.env.NODE_ENV === 'development' ? (
      <section className="bg-bg py-8 text-center text-muted font-display italic">
        [Pedigree] собака не задана или не найдена
      </section>
    ) : null;
  }

  const ped = dog.pedigree ?? [];
  if (ped.length < 2) {
    return process.env.NODE_ENV === 'development' ? (
      <section className="bg-bg py-8 text-center text-muted font-display italic">
        [Pedigree] у собаки «{dog.name}» родословная не загружена. Запустить{' '}
        <code className="font-mono">pnpm seed:fetch-pedigree</code>.
      </section>
    ) : null;
  }

  const title = node.data?.title?.trim() || 'Родословная';
  return dog.rkfId != null ? (
    <PedigreeTree ancestors={ped} title={title} sourceRkfId={dog.rkfId} />
  ) : (
    <PedigreeTree ancestors={ped} title={title} />
  );
}
