import type { BlockNode, LitterDoc, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { getLitterById } from '@/lib/api-client';
import { ContentFrame } from '@/blocks/decor/ContentFrame';

import { PuppyCard, puppyGridClass } from './_shared';

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

  // Визитка пары больше НЕ встраивается в puppy-grid. Она отдельной секцией
  // выводится через LitterPairCardBlock. См. комментарий там.
  return (
    <section className="bg-bg pt-6 md:pt-8 pb-9 md:pb-12">
      <ContentFrame side="none" className="px-6">
        <div className={cn(puppyGridClass(visiblePuppies.length))}>
          {visiblePuppies.map((p) => (
            <PuppyCard key={p.id} puppy={p} litterId={litter.id} />
          ))}
        </div>
      </ContentFrame>
    </section>
  );
}
