import type { PedigreeAncestor } from '@veo55/contracts';

import { cn } from '@/lib/utils';

/**
 * PedigreeTree — generic презентационный компонент родословной (3-колоночное
 * дерево 8-4-2 по heap-layout). НЕ знает откуда данные (наша БД / РКФ-прокси /
 * статика). Принимает плоский массив предков с `position` 1..14.
 *
 * @remarks
 * **R9 — после второго случая обобщения.** Используется:
 *  - Pedigree.tsx (наш блок, читает Dogs.pedigree[] из Payload)
 *  - /catalog?dog=N (РКФ-прокси, читает RKF-парсер)
 *
 * **Server Component (R14).** Полностью статический рендер.
 *
 * **R2 — токены.** Линии и hover через `border-[color:var(--line)]` /
 * `bg-paper` / `border-accent` — не hex.
 *
 * **Layout heap (legacy `catalog.php`):**
 *  - col-par (родители) — позиции 1, 8
 *  - col-ded (бабушки/дедушки) — 2, 5, 9, 12
 *  - col-prad (прабабушки/прадеды) — 3, 4, 6, 7, 10, 11, 13, 14
 *
 * **Mobile (<md):** flex-column в порядке родители → деды → прадеды (скролл
 * сверху-вниз = от близкого предка к дальнему).
 */
export interface PedigreeTreeProps {
  readonly ancestors: ReadonlyArray<PedigreeAncestor>;
  /** Шаблон ссылки на предка: `(rkfId) => href`. По умолчанию `/catalog?dog={rkfId}`. */
  readonly hrefForAncestor?: (rkfId: number) => string;
  /** Title секции (если не передан — без заголовка, чистое дерево). */
  readonly title?: string;
  /** Опциональная подпись «Данные: РКФ-каталог» — показывается если есть `rkfId`. */
  readonly sourceRkfId?: number;
}

const COL_PAR_POSITIONS = [1, 8] as const;
const COL_DED_POSITIONS = [2, 5, 9, 12] as const;
const COL_PRAD_POSITIONS = [3, 4, 6, 7, 10, 11, 13, 14] as const;

export function PedigreeTree({
  ancestors,
  hrefForAncestor = defaultHref,
  title,
  sourceRkfId,
}: PedigreeTreeProps) {
  if (ancestors.length < 2) return null;

  const byPosition = new Map<number, PedigreeAncestor>();
  for (const a of ancestors) byPosition.set(a.position, a);

  return (
    <section className="bg-bg pt-8 md:pt-12 pb-8 md:pb-12">
      <div className="mx-auto max-w-[880px] px-6">
        {title && (
          <header className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-h2 font-semibold text-ink leading-tight">
              {title}
            </h2>
            <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
          </header>
        )}

        {/* Desktop: grid 3 колонки + connecting lines */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-x-[18px] mt-1.5 mb-2">
            <ColHead>Прабабушки/Прадеды</ColHead>
            <ColHead>Бабушки/Дедушки</ColHead>
            <ColHead>Родители</ColHead>
          </div>
          <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-x-[18px] relative">
            <PedigreeColumn
              positions={COL_PRAD_POSITIONS}
              byPosition={byPosition}
              variant="prad"
              hrefForAncestor={hrefForAncestor}
            />
            <PedigreeColumn
              positions={COL_DED_POSITIONS}
              byPosition={byPosition}
              variant="ded"
              hrefForAncestor={hrefForAncestor}
            />
            <PedigreeColumn
              positions={COL_PAR_POSITIONS}
              byPosition={byPosition}
              variant="par"
              hrefForAncestor={hrefForAncestor}
            />
          </div>
        </div>

        {/* Mobile: stack родители → деды → прадеды */}
        <div className="md:hidden flex flex-col gap-3.5">
          <MobileColumn
            title="Родители"
            positions={COL_PAR_POSITIONS}
            byPosition={byPosition}
            hrefForAncestor={hrefForAncestor}
          />
          <MobileColumn
            title="Бабушки и Дедушки"
            positions={COL_DED_POSITIONS}
            byPosition={byPosition}
            hrefForAncestor={hrefForAncestor}
          />
          <MobileColumn
            title="Прабабушки и Прадеды"
            positions={COL_PRAD_POSITIONS}
            byPosition={byPosition}
            hrefForAncestor={hrefForAncestor}
          />
        </div>

        <p className="mt-8 text-center text-[12.5px] font-display italic text-muted">
          Данные:{' '}
          {sourceRkfId ? (
            <a
              href={`https://www.veorkf.ru/catalog/dog.php?id=${sourceRkfId}`}
              target="_blank"
              rel="noopener nofollow"
              className="underline decoration-accent underline-offset-[3px] hover:decoration-[2px] transition-[text-decoration-thickness]"
            >
              РКФ-каталог ВЕО (veorkf.ru)
            </a>
          ) : (
            'РКФ-каталог ВЕО'
          )}
        </p>
      </div>
    </section>
  );
}

function defaultHref(rkfId: number): string {
  return `/catalog?dog=${rkfId}`;
}

function ColHead({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] text-muted text-center font-bold uppercase tracking-[1px]">
      {children}
    </div>
  );
}

type ColVariant = 'par' | 'ded' | 'prad';

function PedigreeColumn({
  positions,
  byPosition,
  variant,
  hrefForAncestor,
}: {
  readonly positions: ReadonlyArray<number>;
  readonly byPosition: Map<number, PedigreeAncestor>;
  readonly variant: ColVariant;
  readonly hrefForAncestor: (rkfId: number) => string;
}) {
  const rowsClass =
    variant === 'par' ? 'grid-rows-2' : variant === 'ded' ? 'grid-rows-4' : 'grid-rows-8';
  return (
    <div className={cn('grid gap-1.5 relative', rowsClass)}>
      {positions.map((pos) => (
        <PCard
          key={pos}
          ancestor={byPosition.get(pos)}
          variant={variant}
          hrefForAncestor={hrefForAncestor}
        />
      ))}
    </div>
  );
}

function MobileColumn({
  title,
  positions,
  byPosition,
  hrefForAncestor,
}: {
  readonly title: string;
  readonly positions: ReadonlyArray<number>;
  readonly byPosition: Map<number, PedigreeAncestor>;
  readonly hrefForAncestor: (rkfId: number) => string;
}) {
  return (
    <div>
      <p className="text-[10.5px] text-muted text-center font-bold uppercase tracking-[1px] mt-2.5 mb-2">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">
        {positions.map((pos) => (
          <PCard
            key={pos}
            ancestor={byPosition.get(pos)}
            variant="mobile"
            hrefForAncestor={hrefForAncestor}
          />
        ))}
      </div>
    </div>
  );
}

function PCard({
  ancestor,
  variant,
  hrefForAncestor,
}: {
  readonly ancestor: PedigreeAncestor | undefined;
  readonly variant: ColVariant | 'mobile';
  readonly hrefForAncestor: (rkfId: number) => string;
}) {
  const isPrad = variant === 'prad';
  const isPar = variant === 'par';
  const isDesktop = variant !== 'mobile';
  const isEmpty = !ancestor || !ancestor.name;

  const linesBefore =
    isDesktop && (variant === 'ded' || variant === 'par') && !isEmpty
      ? "before:content-[''] before:absolute before:left-[-9px] before:top-0 before:bottom-0 before:w-[9px] before:border-l-[1.5px] before:border-[#E5DCC9]"
      : '';
  const linesAfter =
    isDesktop && (variant === 'prad' || variant === 'ded') && !isEmpty
      ? "after:content-[''] after:absolute after:top-1/2 after:right-[-9px] after:w-[9px] after:h-[1.5px] after:bg-[#E5DCC9]"
      : '';

  const paddingClass = isPrad ? 'px-[10px] py-1.5' : isPar ? 'px-3 py-2.5' : 'px-3 py-2';
  const nameSizeClass = isPrad ? 'text-[12px]' : isPar ? 'text-[13.5px]' : 'text-[13px]';

  if (isEmpty) {
    return (
      <div
        className={cn(
          'relative rounded-md border border-dashed border-[#E5DCC9] opacity-40',
          'flex items-center justify-center',
          paddingClass,
        )}
        aria-hidden
      >
        <span className="text-[12px] font-display italic text-muted">—</span>
      </div>
    );
  }

  const href = ancestor.rkfId ? hrefForAncestor(ancestor.rkfId) : null;
  const Tag = href ? 'a' : 'div';
  return (
    <Tag
      {...(href ? { href } : {})}
      className={cn(
        'relative bg-paper border border-[#E5DCC9] rounded-md',
        'flex flex-col justify-center no-underline text-ink',
        'transition-colors duration-150',
        href && 'hover:bg-accent-soft hover:border-accent',
        paddingClass,
        linesBefore,
        linesAfter,
      )}
    >
      <span className={cn('font-bold font-sans leading-[1.2] block break-words', nameSizeClass)}>
        {ancestor.name}
      </span>
      {ancestor.note && (
        <span className="text-muted text-[11px] leading-[1.25] block mt-0.5 font-sans">
          {ancestor.note}
        </span>
      )}
    </Tag>
  );
}
