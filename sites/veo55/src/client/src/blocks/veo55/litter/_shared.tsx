import type { DogDoc, MediaRef, Puppy } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { lexicalToParagraphs } from '@/lib/lexical-text';
import { ContentFrame } from '@/blocks/decor/ContentFrame';
import { Carousel } from '@/blocks/primitives/Carousel';
import { LightboxImageGroup } from '@/blocks/primitives/LightboxImageGroup';
import { PhotoCountBadge } from '@/blocks/primitives/PhotoCountBadge';

/**
 * Shared-примитивы блоков помёта. Используются декомпозированными блоками
 * `litter-header`, `litter-pair-card`, `litter-puppies`. Раньше жили в
 * монолите `LitterCardBlock.tsx` — он был удалён как мёртвый код.
 */

export function PairCardGallery({
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

  return (
    <ContentFrame side="both" decor="vines" className={className}>
      <article
        className={cn(
          'group bg-paper rounded-[14px] overflow-hidden flex flex-col',
          'shadow-[0_6px_18px_rgba(43,34,26,0.08)] hover:shadow-[0_10px_28px_rgba(43,34,26,0.14)]',
          'hover:-translate-y-0.5 transition-all duration-300 ease-out',
          single && 'mx-auto max-w-[520px]',
        )}
      >
        {single ? (
          <div className="relative bg-surface-hover">
            <LightboxImageGroup
              photos={items.map((it) => ({ url: it.url, alt: it.alt ?? 'Визитка пары' }))}
              groupId={`pair-${items[0]?.id ?? 'unknown'}`}
              containerClassName="block"
              itemClassName="block w-full"
              imgClassName="block w-full h-auto"
            />
          </div>
        ) : (
          <div className="relative aspect-[4/5] bg-surface-hover overflow-hidden">
            <div className="absolute inset-0">
              <Carousel
                slides={items.map((it) => ({ url: it.url, alt: it.alt ?? 'Визитка пары' }))}
                arrows
                swipe
                objectFit="cover"
                height="100%"
                lightboxGroupId={`pair-${items[0]?.id ?? 'unknown'}`}
              />
            </div>
            <PhotoCountBadge count={items.length} />
          </div>
        )}
        {caption && (
          <div className="px-6 py-5 flex-1 flex flex-col">
            <h4 className="font-display text-xl font-semibold text-ink leading-tight">
              Визитка пары
            </h4>
            <p className="mt-2 font-display italic text-muted text-sm leading-relaxed">{caption}</p>
          </div>
        )}
      </article>
    </ContentFrame>
  );
}

/**
 * Перенос имён собак только по пробелу — дефис в имени не точка переноса.
 * «БЕТЭЛЬГЕЙЗЕ ЛАЭРС МАРС-АРЭС» не должно ломаться на «МАРС-» + «АРЭС».
 */
function renderWordWrapped(name: string | null) {
  if (!name) return '—';
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

export function ParentsBar({
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

export function PuppyCard({
  puppy,
  litterId,
}: {
  readonly puppy: Puppy;
  readonly litterId?: string | number;
}) {
  const label = puppyLabel(puppy);
  // Сворачиваем photos array → плоский список { url, alt }, отфильтровывая
  // битые (без url). Если photos пустой — `items` пустой, рендерим плейсхолдер.
  const items = (puppy.photos ?? [])
    .map((p) => ({
      url: resolveMediaUrl(p.image),
      alt: resolveMediaAlt(p.image) ?? label,
    }))
    .filter((it): it is { url: string; alt: string } => Boolean(it.url));
  const groupId = litterId ? `puppy-${litterId}-${puppy.id}` : `puppy-${puppy.id}`;
  const single = items.length <= 1;
  return (
    <article className="group bg-paper rounded-[14px] overflow-hidden shadow-[0_6px_18px_rgba(43,34,26,0.08)] hover:shadow-[0_10px_28px_rgba(43,34,26,0.14)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col w-full h-full">
      <div className="relative aspect-[4/5] bg-surface-hover overflow-hidden">
        {items.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted font-display italic text-sm">
            Фото скоро
          </div>
        ) : single ? (
          <LightboxImageGroup
            photos={items}
            groupId={groupId}
            containerClassName="absolute inset-0"
            itemClassName="absolute inset-0 w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <>
            <div className="absolute inset-0">
              <Carousel
                slides={items}
                arrows
                swipe
                objectFit="cover"
                height="100%"
                lightboxGroupId={groupId}
              />
            </div>
            <PhotoCountBadge count={items.length} />
          </>
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
 * VisitkaCard — визитка пары, оформленная как карточка-сосед к {@link PuppyCard}.
 * Используется когда визитка встаёт в puppy-grid (нечётное число щенков). Один
 * визуальный шаблон (aspect-[4/5] фото cover + caption-блок), но **собственный**
 * API под визитку: список фоток (карусель + 📷 N badge для multi), h4 «Визитка
 * пары», подпись из CMS.
 *
 * Намеренно НЕ переиспользуем PuppyCard через pseudo-Puppy — это размывало бы
 * контракт PuppyCard (искусственный sex / state, hideStateBadge prop ради
 * одного use-case). Дубликат article-shell ~25 строк — приемлемо (R9: общий
 * shell вынесем когда появится третий потребитель).
 */
export function VisitkaCard({
  images,
  caption,
  litterId,
}: {
  readonly images: ReadonlyArray<{ readonly id: string; readonly image: MediaRef }>;
  readonly caption?: string | undefined;
  readonly litterId?: string | number;
}) {
  const items = images
    .map((it) => ({ id: it.id, url: resolveMediaUrl(it.image), alt: resolveMediaAlt(it.image) }))
    .filter((it): it is { id: string; url: string; alt: string | undefined } => Boolean(it.url));
  if (items.length === 0) return null;
  const single = items.length === 1;
  const groupId = litterId ? `pair-${litterId}` : `pair-${items[0]!.id}`;
  return (
    <article className="group bg-paper rounded-[14px] overflow-hidden shadow-[0_6px_18px_rgba(43,34,26,0.08)] hover:shadow-[0_10px_28px_rgba(43,34,26,0.14)] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col w-full h-full">
      <div className="relative aspect-[4/5] bg-surface-hover overflow-hidden">
        {single ? (
          <LightboxImageGroup
            photos={[{ url: items[0]!.url, alt: items[0]!.alt ?? 'Визитка пары' }]}
            groupId={groupId}
            containerClassName="absolute inset-0"
            itemClassName="absolute inset-0 w-full h-full"
            imgClassName="absolute inset-0 w-full h-full object-cover [object-position:center_25%] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <>
            <div className="absolute inset-0">
              <Carousel
                slides={items.map((it) => ({ url: it.url, alt: it.alt ?? 'Визитка пары' }))}
                arrows
                swipe
                objectFit="cover"
                height="100%"
                lightboxGroupId={groupId}
              />
            </div>
            <PhotoCountBadge count={items.length} />
          </>
        )}
      </div>
      <div className="px-6 py-5 flex-1 flex flex-col">
        <h4 className="font-display text-xl font-semibold text-ink leading-tight">Визитка пары</h4>
        {caption && (
          <p className="mt-2 font-display italic text-muted text-sm leading-relaxed">{caption}</p>
        )}
      </div>
    </article>
  );
}

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

function StateBadge({
  state,
  sex,
}: {
  readonly state: Puppy['state'];
  readonly sex: Puppy['sex'];
}) {
  if (state === 'hidden') return null;
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
  const colorVar =
    state === 'available'
      ? 'var(--color-puppy-available)'
      : state === 'reserved'
        ? 'var(--color-puppy-reserved)'
        : 'rgba(43, 34, 26, 0.7)';
  return (
    <span
      className={cn(
        'absolute inset-x-0 bottom-0 z-[2] flex items-center justify-center',
        'h-16 px-3 pt-3.5 pb-2',
        'font-display italic font-bold uppercase',
        'text-[24px] tracking-[6px]',
        'max-md:text-[17px] max-md:tracking-[4px] max-md:h-[52px] max-md:pt-2.5 max-md:pb-1.5',
        // Тёмный градиент снизу подкладывается под текст — обеспечивает контраст
        // на светлых фотках. Высота градиента ~2× высоты badge'а: мягкий заход
        // сверху, плотная полка внизу.
        'bg-gradient-to-t from-black/65 via-black/40 to-transparent',
      )}
      style={{
        color: colorVar,
        // Тонкий тёмный halo вокруг глифа — добивает читаемость на пёстрых фонах
        // (трава с пятнами света), не мешая основной цветовой подсветке.
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.55), 0 0 12px rgba(0, 0, 0, 0.35)',
        ...(state === 'available'
          ? { animation: 'veo-pup-status-pulse 2.4s ease-in-out infinite' }
          : {}),
      }}
    >
      {label}
    </span>
  );
}

export function puppyGridClass(count: number): string {
  if (count === 1) return 'mx-auto max-w-md';
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-16';
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12';
  if (count === 4) return 'grid grid-cols-1 sm:grid-cols-2 gap-16';
  if (count <= 6) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12';
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12';
}

export function resolveMediaUrl(ref: MediaRef | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === 'string') return undefined;
  return ref.url;
}

export function resolveMediaAlt(ref: MediaRef | undefined): string | undefined {
  if (!ref || typeof ref === 'string') return undefined;
  return ref.alt;
}

export function formatDob(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}
