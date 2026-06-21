import type { BlockNode, LitterDoc, SiteSettings } from '@veo55/contracts';

import { getLitterById } from '@/lib/api-client';
import { ContentFrame } from '@/blocks/decor/ContentFrame';

import { ParentsBar, formatDob } from './LitterCardBlock';
import { CopyLinkButton } from './CopyLinkButton';
import { LitterAvailabilityCta } from './LitterAvailabilityCta';

/**
 * LitterHeader — заголовок помёта (название + дата рождения) + блок родителей.
 *
 * @remarks
 * Часть декомпозиции монолитного `litter-card` на три атомарных блока — даёт
 * возможность располагать заголовок/визитку/щенков произвольно на странице
 * и фреймить каждый независимо.
 *
 * Server Component (R14). Тянет помёт с depth=2 (нужно populated `mother`/`father`
 * для регалий в ParentsBar).
 */
export interface LitterHeaderData {
  readonly litter?: string | LitterDoc;
}

export async function LitterHeader({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<LitterHeaderData> };
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

  // helper не задан / скрыт / не доступен анониму (status=hidden) → блок
  // тихо пропускается. Раньше показывали dev-notice, но эту страницу видит
  // публика, не разработчик — техсообщения недопустимы.
  if (!litter || litter.status === 'hidden') return null;

  const dobLabel = formatDob(litter.dob);
  // На странице помёта те же hidden/sold-фильтры что в LitterCardBlock —
  // CTA-бейдж показывает только то, что видит публика.
  const visiblePuppies = litter.puppies.filter((p) => p.state !== 'hidden' && p.state !== 'sold');

  return (
    <section className="bg-bg pt-12 md:pt-16 pb-4 md:pb-6">
      <ContentFrame side="none" className="px-6">
        <LitterAvailabilityCta status={litter.status} visiblePuppies={visiblePuppies} />
        <header className="text-center mb-8 md:mb-10">
          <h2 className="font-display text-3xl md:text-h2 font-semibold text-ink leading-tight">
            {litter.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-display italic text-muted text-base md:text-lg">
            {dobLabel && <span>Дата рождения · {dobLabel}</span>}
            <span aria-hidden className="text-accent/60">
              ·
            </span>
            <CopyLinkButton path={`puppies/${litter.dob.slice(0, 10)}/${litter.letter}`} />
          </div>
        </header>
        <ParentsBar
          mother={litter.mother}
          father={litter.father}
          showMotherTitles={litter.showMotherTitles}
          showMotherDescription={litter.showMotherDescription}
          showFatherTitles={litter.showFatherTitles}
          showFatherDescription={litter.showFatherDescription}
        />
      </ContentFrame>
    </section>
  );
}
