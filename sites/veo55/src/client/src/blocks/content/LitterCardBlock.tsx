import type { BlockNode, DogDoc, LitterDoc, MediaRef, Puppy, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { lexicalToParagraphs } from '@/lib/lexical-text';
import { getLitterById } from '@/lib/api-client';

/**
 * LitterCardBlock — карточка помёта на странице.
 *
 * @remarks
 * **Server Component (R14).** Принимает `litterId` из CMS-блока и сам тянет
 * данные помёта с populated родителями (`getLitterById` с depth=2).
 *
 * **Адаптивная раскладка** (R5+/R5++):
 *  - **Визитка пары** — рендерится только если задана `pairCard.image`.
 *  - **Парный layout 1+1** — если есть визитка и ровно один видимый щенок,
 *    на ПК показываем визитку слева и карточку щенка справа.
 *  - **Сетка щенков** меняет колонки от 1 до 10:
 *      1 → одиночная центрированная (или соседом для визитки в 1+1)
 *      2 → 2 колонки на ПК
 *      3 → 3 колонки
 *      4 → 4 колонки
 *      5-6 → 3 колонки (2 ряда)
 *      7-10 → 4 колонки
 *  - **Sold** скрыты по умолчанию (флаг блока `showSold` для архивов),
 *    **hidden** скрыты всегда.
 *
 * **Произвольные секции страницы помёта** (рамка «отборное поведение Чипсы»,
 * врезка, баннер) ставятся **рядом** с этим блоком на странице как обычные
 * Prose/Quote — это и есть «секция для произвольной вставки».
 */
export interface LitterCardData {
  readonly litter?: string | LitterDoc;
  readonly showSold?: boolean;
}

export async function LitterCardBlock({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<LitterCardData> };
  readonly settings: SiteSettings;
}) {
  const litterRef = node.data?.litter;
  const showSold = node.data?.showSold ?? false;

  // CMS populated relation возвращает объект; если строка id — тянем сами.
  const litter: LitterDoc | null =
    typeof litterRef === 'object' && litterRef !== null
      ? (litterRef as LitterDoc)
      : typeof litterRef === 'string'
        ? await getLitterById(litterRef)
        : null;

  if (!litter) {
    return process.env.NODE_ENV === 'development' ? (
      <section className="bg-bg py-8 text-center text-muted font-display italic">
        [LitterCardBlock] помёт не задан или не найден
      </section>
    ) : null;
  }

  if (litter.status === 'hidden') return null;

  const visiblePuppies = litter.puppies.filter((p) => {
    if (p.state === 'hidden') return false;
    if (p.state === 'sold' && !showSold) return false;
    return true;
  });

  const hasPair = Boolean(resolveMediaUrl(litter.pairCard?.image));
  const descriptionParagraphs = lexicalToParagraphs(litter.description);
  const dobLabel = formatDob(litter.dob);
  const pairAndSinglePuppy = hasPair && visiblePuppies.length === 1;

  return (
    <section className="bg-bg py-12 md:py-20">
      <div className="mx-auto max-w-wide px-6">
        <header className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-3xl md:text-h2 font-semibold text-ink">
            {litter.title}
          </h2>
          {dobLabel && (
            <p className="mt-2 font-sans text-muted text-sm md:text-base">
              Дата рождения · {dobLabel}
            </p>
          )}
          <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
        </header>

        {pairAndSinglePuppy ? (
          <div className="grid gap-8 lg:grid-cols-[3fr_2fr] items-start">
            <PairCardFigure image={litter.pairCard!.image} caption={litter.pairCard?.caption} />
            <div className="mx-auto w-full max-w-md">
              <PuppyCard puppy={visiblePuppies[0]!} />
            </div>
          </div>
        ) : (
          <>
            {hasPair && litter.pairCard?.image && (
              <PairCardFigure
                image={litter.pairCard.image}
                caption={litter.pairCard.caption}
                className="mb-10 md:mb-14"
              />
            )}

            <ParentsBar
              mother={litter.mother}
              father={litter.father}
              showMotherTitles={litter.showMotherTitles}
              showMotherDescription={litter.showMotherDescription}
              showFatherTitles={litter.showFatherTitles}
              showFatherDescription={litter.showFatherDescription}
            />

            {descriptionParagraphs.length > 0 && (
              <div className="mx-auto max-w-[880px] my-10 md:my-14 font-display italic text-ink text-lg md:text-[20px] leading-[1.55] text-left">
                {descriptionParagraphs.map((p, i) => (
                  <p key={i} className={i > 0 ? 'mt-4' : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            )}

            {visiblePuppies.length > 0 && (
              <div className={puppyGridClass(visiblePuppies.length)}>
                {visiblePuppies.map((p) => (
                  <PuppyCard key={p.id} puppy={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function PairCardFigure({
  image,
  caption,
  className,
}: {
  readonly image: MediaRef;
  readonly caption?: string | undefined;
  readonly className?: string | undefined;
}) {
  const url = resolveMediaUrl(image);
  const alt = resolveMediaAlt(image) ?? 'Визитка пары';
  if (!url) return null;
  return (
    <figure className={cn('mx-auto max-w-3xl', className)}>
      <img
        src={url}
        alt={alt}
        className="w-full h-auto rounded-xl shadow-[0_4px_18px_rgba(43,34,26,0.08)]"
      />
      {caption && (
        <figcaption className="mt-3 text-center font-display italic text-muted text-[15px] md:text-base">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ParentsBar({
  mother,
  father,
  showMotherTitles,
  showMotherDescription,
  showFatherTitles,
  showFatherDescription,
}: {
  readonly mother: string | DogDoc;
  readonly father: string | DogDoc;
  readonly showMotherTitles: boolean;
  readonly showMotherDescription: boolean;
  readonly showFatherTitles: boolean;
  readonly showFatherDescription: boolean;
}) {
  return (
    <div className="grid gap-6 md:gap-10 md:grid-cols-2 mb-2">
      <ParentSlot
        role="Мать"
        dog={mother}
        showTitles={showMotherTitles}
        showDescription={showMotherDescription}
      />
      <ParentSlot
        role="Отец"
        dog={father}
        showTitles={showFatherTitles}
        showDescription={showFatherDescription}
      />
    </div>
  );
}

function ParentSlot({
  role,
  dog,
  showTitles,
  showDescription,
}: {
  readonly role: 'Мать' | 'Отец';
  readonly dog: string | DogDoc;
  readonly showTitles: boolean;
  readonly showDescription: boolean;
}) {
  if (typeof dog === 'string') {
    return (
      <div className="text-center text-muted font-display italic text-sm">
        {role} (не загружен): id={dog}
      </div>
    );
  }
  const descriptionParagraphs = showDescription ? lexicalToParagraphs(dog.description) : [];
  return (
    <div className="text-center md:text-left">
      <p className="font-sans uppercase tracking-[0.08em] text-xs text-muted">{role}</p>
      <h3 className="font-display text-2xl md:text-3xl font-semibold text-ink mt-1">{dog.name}</h3>
      {showTitles && dog.titles && dog.titles.length > 0 && (
        <ul className="mt-2 space-y-0.5 font-display italic text-muted text-sm md:text-base">
          {dog.titles.map((t, i) => (
            <li key={i}>
              {t.text}
              {t.year ? ` · ${t.year}` : ''}
            </li>
          ))}
        </ul>
      )}
      {descriptionParagraphs.length > 0 && (
        <div className="mt-3 font-sans text-ink/80 text-sm leading-relaxed">
          {descriptionParagraphs.map((p, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : undefined}>
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function PuppyCard({ puppy }: { readonly puppy: Puppy }) {
  const url = resolveMediaUrl(puppy.photo);
  const alt = resolveMediaAlt(puppy.photo) ?? puppy.name ?? 'Щенок';
  return (
    <article className="bg-surface rounded-xl overflow-hidden shadow-[0_4px_14px_rgba(43,34,26,0.06)] flex flex-col">
      <div className="relative aspect-[4/5] bg-surface-hover">
        {url ? (
          <img src={url} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted font-display italic text-sm">
            Фото скоро
          </div>
        )}
        <StateBadge state={puppy.state} />
      </div>
      <div className="px-4 py-3 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-display text-lg font-semibold text-ink truncate">
            {puppy.name ?? (puppy.sex === 'male' ? 'Кобель' : 'Сука')}
          </h4>
          <span className="font-sans text-xs text-muted shrink-0">
            {puppy.sex === 'male' ? 'кобель' : 'сука'}
          </span>
        </div>
        {puppy.notes && (
          <p className="mt-1 font-display italic text-muted text-sm leading-snug">{puppy.notes}</p>
        )}
      </div>
    </article>
  );
}

function StateBadge({ state }: { readonly state: Puppy['state'] }) {
  if (state === 'hidden') return null;
  const label =
    state === 'available' ? 'Свободен' : state === 'reserved' ? 'Забронирован' : 'Продан';
  const tone =
    state === 'available'
      ? 'bg-accent text-ink'
      : state === 'reserved'
        ? 'bg-surface text-ink border border-border'
        : 'bg-ink/80 text-bg';
  return (
    <span
      className={cn(
        'absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md',
        'font-sans uppercase tracking-[0.06em] text-[11px] font-semibold',
        tone,
      )}
    >
      {label}
    </span>
  );
}

function puppyGridClass(count: number): string {
  // 1 → одиночная центрированная карточка.
  if (count === 1) return 'mx-auto max-w-md';
  // 2 → 2 колонки на десктопе, центрирование контейнером.
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto';
  // 3 → 3 колонки на десктопе.
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
  // 4 → 4 колонки на десктопе ровно.
  if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';
  // 5-6 → 3 колонки (2 ровных ряда из 3 / неровный).
  if (count <= 6) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
  // 7-10 → 4 колонки (2-3 ряда).
  return 'grid grid-cols-2 lg:grid-cols-4 gap-6';
}

function resolveMediaUrl(ref: MediaRef | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return undefined; // нужен populated объект
  return ref.url;
}

function resolveMediaAlt(ref: MediaRef | undefined): string | undefined {
  if (!ref || typeof ref === 'string') return undefined;
  return ref.alt;
}

function formatDob(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}
