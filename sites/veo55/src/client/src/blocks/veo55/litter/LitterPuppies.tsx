import type { BlockNode, LitterDoc, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { getLitterById } from '@/lib/api-client';
import { ContentFrame } from '@/blocks/decor/ContentFrame';

import { PuppyCard, pairAsPuppy, puppyGridClass, resolveMediaUrl } from './_shared';

/**
 * LitterPuppies — секция «Сетка карточек щенков».
 *
 * @remarks
 * Часть декомпозиции `litter-card`. Раскладка сетки определяется количеством
 * видимых щенков (см. `puppyGridClass`).
 *
 * Server Component (R14).
 */
export interface LitterPuppiesData {
  readonly litter?: string | LitterDoc;
  readonly showSold?: boolean;
}

export async function LitterPuppies({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<LitterPuppiesData> };
  readonly settings: SiteSettings;
}) {
  const litterRef = node.data?.litter;
  const showSold = node.data?.showSold ?? false;
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

  const visiblePuppies = litter.puppies.filter((p) => {
    if (p.state === 'hidden') return false;
    if (p.state === 'sold' && !showSold) return false;
    return true;
  });
  if (visiblePuppies.length === 0) return null;

  // Координация с LitterPairCardBlock: при нечётном числе щенков визитка
  // встаёт первой карточкой в грид (через `pairAsPuppy`) — тогда total=n+1
  // чётное и ряды балансируются. Pair-card блок в этом же помёте прячется
  // (см. LitterPairCardBlock — условие `% 2 === 1`).
  const pairImages = (litter.pairCard?.images ?? []).filter((it) => resolveMediaUrl(it.image));
  const pairInGrid = pairImages.length > 0 && visiblePuppies.length % 2 === 1;
  const gridCount = pairInGrid ? visiblePuppies.length + 1 : visiblePuppies.length;

  return (
    <section className="bg-bg pt-6 md:pt-8 pb-9 md:pb-12">
      <ContentFrame side="none" className="px-6">
        <div className={cn(puppyGridClass(gridCount))}>
          {pairInGrid && (
            <PuppyCard
              puppy={pairAsPuppy(pairImages, litter.pairCard?.caption)}
              litterId={litter.id}
              hideStateBadge
            />
          )}
          {visiblePuppies.map((p) => (
            <PuppyCard key={p.id} puppy={p} litterId={litter.id} />
          ))}
        </div>
      </ContentFrame>
    </section>
  );
}
