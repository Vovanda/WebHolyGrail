import type { BlockNode, LitterDoc, SiteSettings } from '@veo55/contracts';

import { getLitterById } from '@/lib/api-client';

import { PairCardGallery, resolveMediaUrl } from './_shared';

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

  // Визитка пары всегда отдельной секцией. Раньше при нечётном числе щенков
  // встраивалась первой карточкой в puppy-grid (для баланса рядов), но это
  // давало баги:
  //   - расхождение в подсчёте видимых щенков с LitterPuppies (он учитывает
  //     showSold, мы — нет) → визитка дублировалась / пропадала
  //   - VisitkaCard в grid кропала горизонтальные фото (aspect 4:5 cover)
  // Решение: визитка ВСЕГДА отдельная секция natural-aspect. Балансировка
  // грида — косметика, не оправдывает class of bugs.
  return (
    <section className="bg-bg pt-6 md:pt-8 pb-6 md:pb-8">
      <PairCardGallery images={pairImages} caption={litter.pairCard?.caption} />
    </section>
  );
}
