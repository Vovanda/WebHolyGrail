import type { BlockNode, LitterDoc, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { getLitterById } from '@/lib/api-client';
import { ContentFrame } from '@/blocks/decor/ContentFrame';

import { PairCardGallery, PuppyCard, puppyGridClass, resolveMediaUrl } from './LitterCardBlock';

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

  // Координация с LitterPairCardBlock: при **ровно 1** щенке этот блок тащит
  // в себя визитку и рендерит её рядом со щенком (50/50 на ПК). Pair-card
  // в этом же помёте сам прячется (см. LitterPairCardBlock single-puppy
  // branch). Универсальная декомпозиция без отдельного «pair-single» блока.
  if (visiblePuppies.length === 1) {
    const pairImages = (litter.pairCard?.images ?? []).filter((it) => resolveMediaUrl(it.image));
    if (pairImages.length > 0) {
      return (
        <section className="bg-bg pt-6 md:pt-8 pb-9 md:pb-12">
          <ContentFrame side="none" className="px-6">
            <div
              className={cn(
                'grid gap-8 md:gap-10 items-stretch justify-items-center',
                'lg:grid-cols-2',
              )}
            >
              <div className="w-full max-w-md">
                <PairCardGallery images={pairImages} caption={litter.pairCard?.caption} />
              </div>
              <div className="w-full max-w-md">
                <PuppyCard puppy={visiblePuppies[0]!} litterId={litter.id} />
              </div>
            </div>
          </ContentFrame>
        </section>
      );
    }
    // Pair нет — рендерим только щенка в центре.
  }

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
