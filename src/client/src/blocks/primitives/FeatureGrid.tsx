'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { CarouselDeck, CarouselItem } from '@/blocks/primitives/Carousel';
import { resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

import { Icon } from './Icon';
import { PhotoLightbox } from './PhotoLightbox';

/**
 * FeatureGrid — сетка карточек с иконкой/заголовком/описанием.
 *
 * Куда ведёт карточка:
 *  - только `details` — модалка с детальным описанием;
 *  - только `href` — карточка целиком становится ссылкой (так собирают
 *    навигацию по услугам: карточка услуги ведёт на её страницу);
 *  - оба — модалка, а `href` показывается в ней кнопкой «Подробнее».
 *
 * 'use client' нужен для state модалки (open/close + Esc).
 */

export interface FeatureGridData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly layout?: 'grid' | 'carousel';
  readonly items?: readonly {
    readonly icon: string;
    readonly title: string;
    readonly subtitle?: string;
    readonly description?: string;
    readonly details?: string;
    readonly href?: string;
    readonly images?: readonly { readonly image?: MediaRef | null }[];
  }[];
}

type FeatureItem = NonNullable<FeatureGridData['items']>[number];

/** Внешняя ссылка открывается в новой вкладке, внутренняя — в текущей. */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function imageUrls(item: FeatureItem): readonly string[] {
  return (item.images ?? [])
    .map((entry) => resolveMediaUrl(entry.image))
    .filter((url): url is string => Boolean(url));
}

/** Сетка держит карточку узкой — там 4/3 экономит высоту; в карусели карточка
 * шире и несёт превью страниц, для них привычнее 16/10. */
type MediaRatio = '4/3' | '16/10';

const RATIO_CLASS: Record<MediaRatio, string> = {
  '4/3': 'aspect-[4/3]',
  '16/10': 'aspect-[16/10]',
};

/** То же соотношение значением: лента примитива берёт его настройкой, не классом. */
const RATIO_VALUE: Record<MediaRatio, string> = {
  '4/3': '4 / 3',
  '16/10': '16 / 10',
};

/**
 * Картинки карточки: одна - статично, несколько - листаются примитивом.
 *
 * @remarks
 * Стрелки и точки стоят поверх кадра: вокруг картинки в карточке места нет.
 * Нажатие на них не всплывает - карточка целиком бывает ссылкой, и листание
 * иначе уводило бы со страницы.
 */
function CardMedia({
  urls,
  alt,
  ratio,
  natural = false,
  onPick,
}: {
  readonly urls: readonly string[];
  readonly alt: string;
  readonly ratio: MediaRatio;
  /**
   * Показать картинку целиком, по её собственным пропорциям.
   *
   * В сетке карточки обрезаются под общее соотношение — иначе ряд разъезжается.
   * В модалке резать нечего: там одна картинка и ей отведено всё место, а
   * баннер с текстом от обрезки теряет как раз текст.
   */
  readonly natural?: boolean;
  /** Клик по картинке — открыть её крупно. */
  readonly onPick?: (index: number) => void;
}) {
  const ratioClass = natural ? '' : RATIO_CLASS[ratio];

  const picture = (url: string, i: number) => (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      data-part="card-media"
      src={url}
      alt={alt}
      {...(onPick ? { onClick: () => onPick(i), role: 'button', tabIndex: 0 } : {})}
      className={
        natural ? `w-full ${onPick ? 'cursor-zoom-in' : ''}` : 'h-full w-full object-cover'
      }
    />
  );

  if (urls.length <= 1) {
    return <div className={`${ratioClass} overflow-hidden bg-surface`}>{picture(urls[0]!, 0)}</div>;
  }

  return (
    <div className="overflow-hidden bg-surface">
      <CarouselDeck
        mode="single"
        loop
        arrows
        dots
        controls="overlay"
        label={alt}
        {...(natural ? {} : { aspect: RATIO_VALUE[ratio] })}
      >
        {urls.map((url, i) => (
          <CarouselItem key={i} width="full">
            {picture(url, i)}
          </CarouselItem>
        ))}
      </CarouselDeck>
    </div>
  );
}

/**
 * Одна карточка. Что делает клик:
 *  - есть `details` → открывает модалку (ссылка уезжает в неё кнопкой);
 *  - есть только `href` → карточка целиком ссылка;
 *  - нет ни того, ни другого → карточка не интерактивна.
 */
function FeatureCard({
  item,
  ratio,
  spanClass,
  onOpen,
}: {
  readonly item: FeatureItem;
  readonly ratio: MediaRatio;
  readonly spanClass?: string;
  readonly onOpen: () => void;
}) {
  const urls = imageUrls(item);
  const href = item.href?.trim();

  const body = (
    <>
      {urls.length > 0 ? (
        <div className="-mx-5 -mt-5 mb-4">
          <CardMedia urls={urls} alt={item.title} ratio={ratio} />
        </div>
      ) : (
        <div className="mx-auto mb-3">
          <Icon
            icon={item.icon}
            label={item.title}
            size={48}
            background="accent-soft"
            innerScale={0.55}
          />
        </div>
      )}
      <div
        data-part="card-title"
        className="font-display font-semibold text-ink text-sm md:text-base"
      >
        {item.title}
      </div>
      {item.subtitle && (
        <div data-part="card-subtitle" className="text-xs text-muted mt-1">
          {item.subtitle}
        </div>
      )}
      {item.description && (
        <div data-part="card-body" className="text-xs text-muted/80 mt-2 leading-snug">
          {item.description}
        </div>
      )}
    </>
  );

  const baseClass = `relative h-full overflow-hidden rounded-xl border border-border bg-bg p-5 text-center hover:shadow-md transition-shadow ${spanClass ?? ''}`;
  const interactiveClass = `${baseClass} group cursor-pointer hover:border-accent/40 text-inherit`;

  if (item.details) {
    return (
      <button
        type="button"
        onClick={onOpen}
        data-part="card"
        className={interactiveClass}
        aria-label={`Подробнее: ${item.title}`}
      >
        {body}
      </button>
    );
  }
  if (href) {
    const external = isExternal(href);
    const Arrow = external ? ArrowUpRight : ArrowRight;
    return (
      <Link
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        data-part="card"
        className={interactiveClass}
      >
        {body}
        <Arrow
          size={16}
          aria-hidden="true"
          className="absolute top-4 right-4 text-muted/60 group-hover:text-accent transition-colors"
        />
      </Link>
    );
  }
  return (
    <div data-part="card" className={baseClass}>
      {body}
    </div>
  );
}

export function FeatureGrid({
  node,
}: {
  readonly node: BlockNode & { data?: FeatureGridData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const heading = data.heading;
  const subtitle = data.subtitle;
  const items = data.items ?? [];
  const isCarousel = data.layout === 'carousel';

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  // 7 items → 2-3-2 шахматка на desktop (6-col grid).
  const isSevenCheckerboard = !isCarousel && items.length === 7;

  return (
    <section className={cn('block-space', isCarousel && 'bg-page-bg')}>
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {heading && (
          <h2
            data-part="title"
            className="text-center font-display text-h3 md:text-h2 font-semibold text-ink"
          >
            {heading}
          </h2>
        )}
        {subtitle && (
          <p data-part="subtitle" className="text-center text-muted mt-3 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        {isCarousel ? (
          <CardCarousel items={items} onOpen={setOpenIdx} />
        ) : (
          <div
            className={
              isSevenCheckerboard
                ? 'mt-10 md:mt-12 grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
                : 'mt-10 md:mt-12 grid gap-4 md:gap-5'
            }
            style={
              !isSevenCheckerboard
                ? { gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
                : undefined
            }
          >
            {items.map((item, i) => {
              const isLast = i === items.length - 1;
              // Растягивать одинокую карточку последнего ряда есть смысл только
              // когда рядов больше одного. На четырёх карточках ряд и так полный,
              // а col-span раздувал последнюю во всю ширину.
              const mayHang = items.length >= 5;
              const hangingMobile = mayHang && isLast && items.length % 2 === 1 ? 'col-span-2' : '';
              const hangingSm = mayHang && isLast && items.length % 3 === 1 ? 'sm:col-span-3' : '';
              const lgSpan = isSevenCheckerboard
                ? i < 2 || i > 4
                  ? 'lg:col-span-3'
                  : 'lg:col-span-2'
                : '';
              return (
                <FeatureCard
                  key={i}
                  item={item}
                  ratio="4/3"
                  spanClass={[hangingMobile, hangingSm, lgSpan].filter(Boolean).join(' ')}
                  onOpen={() => setOpenIdx(i)}
                />
              );
            })}
          </div>
        )}
      </div>
      {openIdx !== null && items[openIdx] && (
        <FeatureModal item={items[openIdx]!} onClose={() => setOpenIdx(null)} />
      )}
    </section>
  );
}

/**
 * Карусель карточек — для длинных списков и крупных превью, когда сетка
 * заставила бы скроллить страницу.
 */
function CardCarousel({
  items,
  onOpen,
}: {
  readonly items: NonNullable<FeatureGridData['items']>;
  readonly onOpen: (idx: number) => void;
}) {
  return (
    <CarouselDeck
      mode="row"
      gap="md"
      edge="gap"
      arrows
      dots
      loop
      marquee
      label="Возможности"
      className="mt-10"
    >
      {items.map((item, i) => (
        <CarouselItem key={i} className="basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
          <FeatureCard item={item} ratio="16/10" onOpen={() => onOpen(i)} />
        </CarouselItem>
      ))}
    </CarouselDeck>
  );
}

function FeatureModal({
  item,
  onClose,
}: {
  readonly item: FeatureItem;
  readonly onClose: () => void;
}) {
  const modalUrls = imageUrls(item);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center overflow-y-auto p-4 animate-[hg-fade-in_180ms_ease-out]"
    >
      <div
        role="dialog"
        aria-labelledby="feature-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto w-full max-w-md rounded-2xl bg-bg border border-border shadow-lg p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface-hover transition-colors"
        >
          <X size={18} />
        </button>
        {modalUrls.length > 0 ? (
          <div className="mb-5 -mx-7 -mt-7 overflow-hidden rounded-t-2xl">
            {/* Картинка услуги — это афиша с текстом: в модалке он мелкий, а по
                клику открывается во весь экран с зумом. */}
            <PhotoLightbox
              slides={modalUrls.map((src) => ({ src, alt: item.title }))}
              groupId={`feature-${item.title}`}
            >
              {(open) => (
                <CardMedia urls={modalUrls} alt={item.title} ratio="16/10" natural onPick={open} />
              )}
            </PhotoLightbox>
          </div>
        ) : (
          <div className="mb-4">
            <Icon
              icon={item.icon}
              label={item.title}
              size={48}
              background="accent-soft"
              innerScale={0.55}
            />
          </div>
        )}
        <h3 id="feature-modal-title" className="font-display text-xl font-semibold text-ink">
          {item.title}
        </h3>
        {item.subtitle && <div className="text-sm text-muted mt-1">{item.subtitle}</div>}
        {item.details && (
          <p className="mt-4 text-sm text-ink/85 leading-relaxed whitespace-pre-line">
            {item.details}
          </p>
        )}
        {item.href && (
          <Link
            href={item.href}
            {...(isExternal(item.href)
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : { onClick: onClose })}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover transition-colors"
          >
            Подробнее
            {isExternal(item.href) ? <ArrowUpRight size={16} /> : <ArrowRight size={16} />}
          </Link>
        )}
      </div>
    </div>
  );
}
