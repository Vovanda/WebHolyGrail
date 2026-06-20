import type { BlockNode, DogDoc, PedigreeAncestor, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { getDogById } from '@/lib/api-client';

/**
 * Pedigree — секция «Родословная» с 3-колоночным деревом 8-4-2 (прадеды +
 * деды/бабки + родители). Дизайн 1:1 с legacy veo55.ru `catalog.php`
 * (inline-CSS `.tree`/`.col-par`/`.col-ded`/`.col-prad`).
 *
 * @remarks
 * **Не Tree primitive (нет рекурсии).** Структура фиксированная: 14 позиций
 * по схеме heap-layout РКФ-парсера. Подробности в `DogDoc.pedigree` JSDoc.
 *
 * Mobile (< md): flex-column в порядке родители → деды → прадеды, заголовки
 * колонок через подписи над секциями.
 *
 * Server Component (R14). Тянет собаку по `dogId` с depth=0 (внутри Dogs
 * лежит `pedigree[]` плоским массивом — relations не нужны).
 */
export interface PedigreeData {
  readonly dog?: string | DogDoc;
  readonly title?: string;
}

const COL_PAR_POSITIONS = [1, 8] as const; // Родители
const COL_DED_POSITIONS = [2, 5, 9, 12] as const; // Бабушки/Дедушки
const COL_PRAD_POSITIONS = [3, 4, 6, 7, 10, 11, 13, 14] as const; // Прабабушки/Прадеды

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
  const byPosition = new Map<number, PedigreeAncestor>();
  for (const a of ped) byPosition.set(a.position, a);

  if (ped.length < 2) {
    return process.env.NODE_ENV === 'development' ? (
      <section className="bg-bg py-8 text-center text-muted font-display italic">
        [Pedigree] у собаки «{dog.name}» родословная не загружена. Запустить{' '}
        <code className="font-mono">pnpm seed:fetch-pedigree</code>.
      </section>
    ) : null;
  }

  const sectionTitle = node.data?.title?.trim() || 'Родословная';

  return (
    <section className="bg-bg pt-12 md:pt-16 pb-12 md:pb-16">
      <div className="mx-auto max-w-[880px] px-6">
        <header className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-h2 font-semibold text-ink leading-tight">
            {sectionTitle}
          </h2>
          <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
        </header>

        {/* Desktop: 3 колонки grid с линиями connecting */}
        <div className="hidden md:block">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-x-[18px] mt-1.5 mb-2 px-0">
            <ColHead>Прабабушки/Прадеды</ColHead>
            <ColHead>Бабушки/Дедушки</ColHead>
            <ColHead>Родители</ColHead>
          </div>
          <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-x-[18px] relative">
            <PedigreeColumn positions={COL_PRAD_POSITIONS} byPosition={byPosition} variant="prad" />
            <PedigreeColumn positions={COL_DED_POSITIONS} byPosition={byPosition} variant="ded" />
            <PedigreeColumn positions={COL_PAR_POSITIONS} byPosition={byPosition} variant="par" />
          </div>
        </div>

        {/* Mobile: stack в обратном порядке (родители первые) */}
        <div className="md:hidden flex flex-col gap-3.5">
          <MobileColumn title="Родители" positions={COL_PAR_POSITIONS} byPosition={byPosition} />
          <MobileColumn
            title="Бабушки и Дедушки"
            positions={COL_DED_POSITIONS}
            byPosition={byPosition}
          />
          <MobileColumn
            title="Прабабушки и Прадеды"
            positions={COL_PRAD_POSITIONS}
            byPosition={byPosition}
          />
        </div>

        <p className="mt-8 text-center text-[12.5px] font-display italic text-muted">
          Данные:{' '}
          {dog.rkfId ? (
            <a
              href={`https://www.veorkf.ru/catalog/dog.php?id=${dog.rkfId}`}
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
}: {
  readonly positions: ReadonlyArray<number>;
  readonly byPosition: Map<number, PedigreeAncestor>;
  readonly variant: ColVariant;
}) {
  // Высота row фиксированная для каждой колонки чтобы линии connecting
  // выстраивались по центру: col-par 2 ряда, col-ded 4, col-prad 8.
  const rowsClass =
    variant === 'par' ? 'grid-rows-2' : variant === 'ded' ? 'grid-rows-4' : 'grid-rows-8';
  return (
    <div className={cn('grid gap-1.5 relative', rowsClass)}>
      {positions.map((pos) => (
        <PCard key={pos} ancestor={byPosition.get(pos)} variant={variant} />
      ))}
    </div>
  );
}

function MobileColumn({
  title,
  positions,
  byPosition,
}: {
  readonly title: string;
  readonly positions: ReadonlyArray<number>;
  readonly byPosition: Map<number, PedigreeAncestor>;
}) {
  return (
    <div>
      <p className="text-[10.5px] text-muted text-center font-bold uppercase tracking-[1px] mt-2.5 mb-2">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">
        {positions.map((pos) => (
          <PCard key={pos} ancestor={byPosition.get(pos)} variant="mobile" />
        ))}
      </div>
    </div>
  );
}

function PCard({
  ancestor,
  variant,
}: {
  readonly ancestor: PedigreeAncestor | undefined;
  readonly variant: ColVariant | 'mobile';
}) {
  const isPrad = variant === 'prad';
  const isPar = variant === 'par';
  const isDesktop = variant !== 'mobile';
  const isEmpty = !ancestor || !ancestor.name;

  // Линии-«хвосты»: горизонтальные правые у col-prad / col-ded, вертикальные
  // левые-стволы у col-ded / col-par (см. catalog.php `.tree .col-* ::before/::after`).
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

  const href = ancestor.rkfId ? `/catalog/${ancestor.rkfId}` : null;

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
