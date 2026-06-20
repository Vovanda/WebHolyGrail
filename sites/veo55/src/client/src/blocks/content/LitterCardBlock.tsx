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

  // Всегда тянем сами с depth=2 чтобы получить populated mother/father (вплоть до
  // Dogs+Media). Родительский getPageBySlug ходит с depth=1 и расходует его на
  // сам блок → relation внутри Litter возвращается id-строкой, без имени и регалий.
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

  const pairImages = (litter.pairCard?.images ?? []).filter((it) => resolveMediaUrl(it.image));
  const hasPair = pairImages.length > 0;
  const descriptionParagraphs = lexicalToParagraphs(litter.description);
  const dobLabel = formatDob(litter.dob);
  const pairAndSinglePuppy = hasPair && visiblePuppies.length === 1;

  return (
    /**
     * Вертикальные отступы:
     *  - top больше bottom — секция «дышит» от предыдущего блока (hero/wave),
     *    к следующему блоку («О нас») подходит **плотнее**, иначе образуется
     *    пустыня между секциями (фидбек Володи 2026-06-19).
     *  - bottom 36–48px укладывается в бренд-правило veo55 (32 mobile / 48 desktop
     *    между секциями), pair с pt квоты «О нас» даёт читабельный шов без воздуха.
     */
    <section className="bg-bg pt-12 md:pt-16 pb-9 md:pb-12">
      <div className="mx-auto max-w-[1150px] px-6">
        <header className="text-center mb-10 md:mb-14">
          <h2 className="font-display text-3xl md:text-h2 font-semibold text-ink leading-tight">
            {litter.title}
          </h2>
          {dobLabel && (
            <p className="mt-3 font-display italic text-muted text-base md:text-lg">
              Дата рождения · {dobLabel}
            </p>
          )}
          <div className="mx-auto mt-5 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
        </header>

        {pairAndSinglePuppy ? (
          <div className="grid gap-10 lg:grid-cols-[3fr_2fr] items-start">
            <PairCardGallery images={pairImages} caption={litter.pairCard?.caption} />
            <div className="mx-auto w-full max-w-md">
              <PuppyCard puppy={visiblePuppies[0]!} />
            </div>
          </div>
        ) : (
          <>
            <ParentsBar
              mother={litter.mother}
              father={litter.father}
              showMotherTitles={litter.showMotherTitles}
              showMotherDescription={litter.showMotherDescription}
              showFatherTitles={litter.showFatherTitles}
              showFatherDescription={litter.showFatherDescription}
            />

            {hasPair && (
              <PairCardGallery
                images={pairImages}
                caption={litter.pairCard?.caption}
                className="mt-10 md:mt-14"
              />
            )}

            {descriptionParagraphs.length > 0 && (
              <div className="mx-auto max-w-[880px] mt-10 md:mt-14 font-display italic text-ink text-lg md:text-[20px] leading-[1.55] text-left">
                {descriptionParagraphs.map((p, i) => (
                  <p key={i} className={i > 0 ? 'mt-4' : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            )}

            {visiblePuppies.length > 0 && (
              <div className={cn('mt-12 md:mt-16', puppyGridClass(visiblePuppies.length))}>
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

/**
 * PairCardGallery — рендер одной или нескольких визиток пары.
 *
 * - 1 визитка → центрированное крупное фото (как в `.veo-litter .vizitka` оригинала)
 * - 2 → две колонки sm:grid-cols-2 равными ширинами
 * - 3+ → grid 2 / 3 колонки с одинаковыми gap'ами
 *
 * Подпись (`caption`) — общая для всей галереи, по центру под изображениями.
 * Радиус 14px и тёплая тень — параметры из legacy `.veo-litter .vizitka`.
 */
function PairCardGallery({
  images,
  caption,
  className,
}: {
  readonly images: ReadonlyArray<{ readonly id: string; readonly image: MediaRef }>;
  readonly caption?: string | undefined;
  readonly className?: string | undefined;
}) {
  const items = images
    .map((it) => ({ id: it.id, url: resolveMediaUrl(it.image), alt: resolveMediaAlt(it.image) }))
    .filter((it): it is { id: string; url: string; alt: string | undefined } => Boolean(it.url));
  if (items.length === 0) return null;

  const single = items.length === 1;
  const gridCols =
    items.length === 2
      ? 'sm:grid-cols-2'
      : items.length === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <figure className={cn('mx-auto', single ? 'max-w-[680px]' : 'max-w-5xl', className)}>
      <div className={single ? '' : cn('grid gap-5 md:gap-6', gridCols)}>
        {items.map((it) => (
          <img
            key={it.id}
            src={it.url}
            alt={it.alt ?? 'Визитка пары'}
            className="w-full h-auto rounded-[14px] shadow-[0_8px_24px_rgba(43,34,26,0.12)]"
          />
        ))}
      </div>
      {caption && (
        <figcaption className="mx-auto max-w-2xl mt-5 md:mt-6 text-center font-display italic text-muted text-[15px] md:text-base leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Перенос имён собак только по пробелу: «БЕТЭЛЬГЕЙЗЕ ЛАЭРС МАРС-АРЭС» не должно
 * разрываться по дефису на «МАРС-» + «АРЭС». Браузер по умолчанию ломает по
 * дефису как валидную точку переноса. Решение — wrap каждого слова в
 * `whitespace-nowrap inline-block`, тогда дефис внутри слова остаётся связным.
 */
function renderWordWrapped(name: string | null) {
  if (!name) return '—';
  // Пробел — отдельный текст-узел МЕЖДУ span'ами, не внутри. Trailing space
  // внутри inline-block элемент схлопывается визуально (имя слипается).
  // Вынесенный пробел даёт нормальный точку переноса между словами.
  const words = name.split(/\s+/);
  return words.flatMap((word, i) => {
    const node = (
      <span key={`w-${i}`} className="whitespace-nowrap inline-block">
        {word}
      </span>
    );
    return i === 0 ? [node] : [<span key={`s-${i}`}> </span>, node];
  });
}

/**
 * ParentsBar — пара «Отец × Мать» с canonical-ссылкой на каждого + collapsible
 * регалии под каждым родителем.
 *
 * Layout 1:1 с прода veo55.ru (`.veo-parents-pair`, inline в #puppies_1):
 *  - desktop: flex row, gap 32px, центр-выровнено, max-width 880px
 *  - mobile <md: gap 20px, cross `×` скрыт (flex-wrap стэк)
 *  - имя — sans uppercase 16px, подчёркивание янтарь thickness 1.5 (hover 2.5)
 *  - role «Отец»/«Мать» — Cormorant italic 28px, цвет muted, letter-spacing .4px
 *  - cross «×» — Cormorant 56px, цвет accent
 *
 * Имя рендерится как `<a href="/dog/<slug>" data-detail-dialog="<slug>">` —
 * **canonical URL собаки** (R13). Без JS / middle-click / new-tab — обычная
 * навигация на /dog/<slug>. С JS — глобальный listener перехватывает клик
 * и открывает DetailDialog как overlay (см. D4). Атрибут `data-detail-dialog`
 * — хук для overlay-listener'а.
 *
 * Под каждым именем — отдельный `<details>` с регалиями (наша надстройка над
 * оригиналом: на проде регалии открыты, у нас их много → схлопнуты по умолчанию).
 * Имя НЕ дублируется внутри disclosure.
 */
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
    <div className="mx-auto max-w-[880px] px-2.5 mb-8 md:mb-[30px] flex flex-wrap items-start justify-center gap-5 md:gap-8">
      <ParentSlot
        role="Отец"
        dog={father}
        showTitles={showFatherTitles}
        showDescription={showFatherDescription}
      />
      <span
        aria-hidden
        className="hidden md:flex font-display font-medium text-[56px] leading-none text-accent select-none self-center px-1"
      >
        ×
      </span>
      <ParentSlot
        role="Мать"
        dog={mother}
        showTitles={showMotherTitles}
        showDescription={showMotherDescription}
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
  const isObj = typeof dog === 'object';
  const name = isObj ? dog.name : null;
  const slug = isObj ? dog.slug : null;
  const titles = isObj && showTitles ? (dog.titles ?? []) : [];
  const descriptionParagraphs =
    isObj && showDescription ? lexicalToParagraphs(dog.description) : [];
  const hasDetails = titles.length > 0 || descriptionParagraphs.length > 0;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[260px] md:min-w-[280px]">
      <span className="font-display italic text-[24px] md:text-[28px] leading-none text-muted tracking-[0.4px]">
        {role}
      </span>
      {slug && name ? (
        <a
          href={`/dog/${slug}`}
          data-detail-dialog={slug}
          className={cn(
            'font-sans font-bold uppercase text-base text-ink text-center leading-snug',
            'underline decoration-accent decoration-[1.5px] underline-offset-[4px]',
            'hover:decoration-[2.5px] transition-[text-decoration-thickness] duration-150',
          )}
        >
          {renderWordWrapped(name)}
        </a>
      ) : (
        <span className="font-sans font-bold uppercase text-base text-ink text-center leading-snug">
          {renderWordWrapped(name)}
        </span>
      )}
      {hasDetails && (
        <details className="group w-full mt-3 [&_summary]:list-none [&_summary::-webkit-details-marker]:hidden">
          {/**
           * Disclosure-триггер по паттерну Timeline.ExpandToggle:
           *  ─── Регалии и подробности ⌄ ───
           * Две тонкие hairline-линии по бокам соединяют имя и развёрнутый
           * блок — даёт «вырезку» вместо плоской кнопки.
           */}
          <summary
            className={cn(
              'flex items-center gap-3 cursor-pointer select-none',
              'text-muted hover:text-accent group-open:text-ink transition-colors',
            )}
          >
            <span aria-hidden className="flex-1 h-px bg-border" />
            <span className="inline-flex items-center gap-1.5 font-display italic text-[14px] tracking-[0.2px] whitespace-nowrap">
              Регалии и подробности
              <svg
                viewBox="0 0 20 20"
                aria-hidden
                className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-open:rotate-180"
              >
                <path
                  d="M5 7l5 6 5-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span aria-hidden className="flex-1 h-px bg-border" />
          </summary>
          <div className="mt-3 text-left">
            {titles.length > 0 && (
              <ul className="space-y-0.5 font-display italic text-muted text-sm">
                {titles.map((t, i) => (
                  <li key={i}>
                    {t.text}
                    {t.year ? ` · ${t.year}` : ''}
                  </li>
                ))}
              </ul>
            )}
            {descriptionParagraphs.length > 0 && (
              <div
                className={cn(
                  titles.length > 0 ? 'mt-3' : '',
                  'font-sans text-ink/80 text-sm leading-relaxed',
                )}
              >
                {descriptionParagraphs.map((p, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

function PuppyCard({ puppy }: { readonly puppy: Puppy }) {
  const url = resolveMediaUrl(puppy.photo);
  const label = puppyLabel(puppy);
  const alt = resolveMediaAlt(puppy.photo) ?? label;
  return (
    /**
     * Карточка «дышит» (бренд-правило veo55: padding 24-32px, gap 24-32px).
     * Hover-лифт — лёгкое translateY -2 + усиленная тёплая тень, без агрессивного
     * scale (Володя 2026-06-15 — «эффекты не отвлекают от контента»).
     * Радиус 14px, shadow `rgba(43,34,26,0.08)` — из legacy `.veo-pup`.
     */
    <article className="group bg-paper rounded-[14px] overflow-hidden shadow-[0_6px_18px_rgba(43,34,26,0.08)] hover:shadow-[0_10px_28px_rgba(43,34,26,0.14)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col">
      <div className="relative aspect-[4/5] bg-surface-hover overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted font-display italic text-sm">
            Фото скоро
          </div>
        )}
        <StateBadge state={puppy.state} sex={puppy.sex} />
      </div>
      <div className="px-6 py-5 flex-1 flex flex-col">
        <h4 className="font-display text-xl font-semibold text-ink leading-tight">{label}</h4>
        {puppy.notes && (
          <p className="mt-2 font-display italic text-muted text-sm leading-relaxed">
            {puppy.notes}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Лейбл щенка — кличка если задана, иначе computed из окраса и пола.
 * Кличек у новорождённых щенков обычно ещё нет — традиция в питомниках обозначать
 * их по окрасу и полу («зонарная девочка», «чепрачный мальчик»).
 */
function puppyLabel(puppy: Puppy): string {
  if (puppy.name && puppy.name.trim()) return puppy.name;
  const sexNoun = puppy.sex === 'male' ? 'мальчик' : 'девочка';
  const colorAdj = puppyColorAdj(puppy.color, puppy.sex);
  return colorAdj ? `${colorAdj} ${sexNoun}` : puppy.sex === 'male' ? 'Кобель' : 'Сука';
}

function puppyColorAdj(color: Puppy['color'] | undefined, sex: Puppy['sex']): string | null {
  if (!color) return null;
  const m = sex === 'male';
  switch (color) {
    case 'cheprachny':
      return m ? 'Чепрачный' : 'Чепрачная';
    case 'zonarny':
      return m ? 'Зонарный' : 'Зонарная';
    case 'cherny':
      return m ? 'Чёрный' : 'Чёрная';
    default:
      return null;
  }
}

/**
 * StateBadge — статус щенка лентой поверх фото.
 *
 * Бренд-правила (veo55 `brand_palette.md`, `anti_grayscale_reserved.md`):
 *  - Никакого grayscale на «забронированных» — это «траурно» (Володя 2026-06-17).
 *  - Свободно → яркий горчично-янтарный (`--accent`) с лифт-тенью — «солнце над травой».
 *  - Бронь → бледный янтарь (`--accent-soft` fon + `--accent-dark` text) — узнаваемый бренд,
 *    но не конкурирует со «Свободно» по громкости.
 *  - Продан (рендерится только когда `showSold`) → тёплый шоколад (`--ink/85`),
 *    лента «архив».
 *
 *  Размещение — bottom-left ленточкой, как «печать» на фотобумаге.
 *  Uppercase + letter-spacing 0.14em + тяжёлый вес — классическая «брендовая лента».
 */
function StateBadge({
  state,
  sex,
}: {
  readonly state: Puppy['state'];
  readonly sex: Puppy['sex'];
}) {
  if (state === 'hidden') return null;
  // Род существительного по полу щенка: male → «Свободен/Продан», female → «Свободна/Продана».
  // «Бронь» — нейтральное существительное без рода, не склоняется.
  const female = sex === 'female';
  const label =
    state === 'available'
      ? female
        ? 'Свободна'
        : 'Свободен'
      : state === 'reserved'
        ? 'Бронь'
        : female
          ? 'Продана'
          : 'Продан';
  const tone =
    state === 'available'
      ? 'bg-accent text-ink shadow-[0_4px_14px_rgba(212,164,55,0.55)]'
      : state === 'reserved'
        ? 'bg-accent-soft text-accent-dark ring-1 ring-accent/30'
        : 'bg-ink/85 text-bg ring-1 ring-ink/20';
  return (
    <span
      className={cn(
        'absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-full',
        'font-sans uppercase tracking-[0.14em] text-[11px] font-bold',
        'backdrop-blur-[1px]',
        tone,
      )}
    >
      {label}
    </span>
  );
}

function puppyGridClass(count: number): string {
  // Gap 32px (gap-8) — бренд veo55 «карточки должны дышать», между ними тот же
  // воздух что в padding'ах самих карточек (px-6 py-5).
  // 1 → одиночная центрированная карточка.
  if (count === 1) return 'mx-auto max-w-md';
  // 2 → 2 колонки на десктопе.
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto';
  // 3 → 3 в строку на десктопе (по запросу Володи: 3 → 1 ряд).
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8';
  // 4 → 2x2 квадрат на десктопе (по запросу Володи: 4 → 2x2, не 4 в ряд).
  if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto';
  // 5-6 → 3 колонки (2 ряда).
  if (count <= 6) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8';
  // 7-10 → 4 колонки.
  return 'grid grid-cols-2 lg:grid-cols-4 gap-8';
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
