import type { BlockNode, LitterDoc, SiteSettings } from '@veo55/contracts';

import { getLitterById } from '@/lib/api-client';

import { PairCardGallery, resolveMediaUrl } from './LitterCardBlock';

/**
 * LitterPairCardBlock — секция «Визитка пары» помёта.
 *
 * @remarks
 * См. `docs/glossary.md → Визитка пары`. Часть декомпозиции `litter-card`.
 * Если у помёта нет валидных `pairCard.images` — возвращает `null`.
 *
 * Server Component (R14).
 */
export interface LitterPairCardData {
  readonly litter?: string | LitterDoc;
}

export async function LitterPairCardBlock({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<LitterPairCardData> };
  readonly settings: SiteSettings;
}) {
  const litterRef = node.data?.litter;
  const litterId: string | null =
    typeof litterRef === 'string'
      ? litterRef
      : typeof litterRef === 'number'
        ? String(litterRef)
        : litterRef && typeof litterRef === 'object'
          ? String((litterRef as { id?: string | number }).id ?? '')
          : null;
  const litter: LitterDoc | null = litterId ? await getLitterById(litterId) : null;

  // см. LitterHeader — публика не должна видеть техсообщения.
  if (!litter || litter.status === 'hidden') return null;

  const pairImages = (litter.pairCard?.images ?? []).filter((it) => resolveMediaUrl(it.image));
  if (pairImages.length === 0) return null;

  // Координация с LitterPuppies: если у помёта **ровно 1** видимый щенок, этот
  // блок прячется — LitterPuppies сам нарисует визитку + щенка в одну строку
  // 50/50 (балансируют друг друга, см. LitterPuppies single-puppy branch).
  const visiblePuppies = litter.puppies.filter((p) => p.state !== 'hidden');
  if (visiblePuppies.length === 1) return null;

  return (
    <section className="bg-bg pt-6 md:pt-8 pb-6 md:pb-8">
      <PairCardGallery images={pairImages} caption={litter.pairCard?.caption} />
    </section>
  );
}
