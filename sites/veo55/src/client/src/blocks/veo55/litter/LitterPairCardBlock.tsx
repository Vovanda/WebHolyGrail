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
      : litterRef && typeof litterRef === 'object'
        ? String((litterRef as { id?: string | number }).id ?? '')
        : null;
  const litter: LitterDoc | null = litterId ? await getLitterById(litterId) : null;

  if (!litter) {
    return process.env.NODE_ENV === 'development' ? (
      <section className="bg-bg py-8 text-center text-muted font-display italic">
        [LitterPairCard] помёт не задан или не найден
      </section>
    ) : null;
  }
  if (litter.status === 'hidden') return null;

  const pairImages = (litter.pairCard?.images ?? []).filter((it) => resolveMediaUrl(it.image));
  if (pairImages.length === 0) return null;

  return (
    <section className="bg-bg pt-6 md:pt-8 pb-6 md:pb-8">
      <PairCardGallery images={pairImages} caption={litter.pairCard?.caption} />
    </section>
  );
}
