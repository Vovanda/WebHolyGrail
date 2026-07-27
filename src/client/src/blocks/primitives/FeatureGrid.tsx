'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { resolveMediaUrl } from '@/lib/media';

import { Icon } from './Icon';

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

/**
 * Картинки карточки: одна — статично, несколько — слайдер.
 *
 * Карточка целиком бывает ссылкой, поэтому стрелки слайдера гасят click —
 * иначе листание уводило бы со страницы.
 */
function CardMedia({
  urls,
  alt,
  ratio,
}: {
  readonly urls: readonly string[];
  readonly alt: string;
  readonly ratio: MediaRatio;
}) {
  const many = urls.length > 1;
  const ratioClass = RATIO_CLASS[ratio];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, []);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const step = useCallback(
    (e: React.MouseEvent, dir: 1 | -1) => {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 1) emblaApi?.scrollNext();
      else emblaApi?.scrollPrev();
    },
    [emblaApi],
  );

  if (!many) {
    return (
      <div className={`${ratioClass} overflow-hidden bg-surface`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="group/media relative overflow-hidden bg-surface">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {urls.map((url, i) => (
            <div key={i} className="min-w-0 flex-[0_0_100%]">
              <div className={ratioClass}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={alt} className="h-full w-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => step(e, -1)}
        aria-label="Предыдущая картинка"
        className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/85 text-muted opacity-0 transition-opacity hover:text-ink group-hover/media:opacity-100 focus-visible:opacity-100"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => step(e, 1)}
        aria-label="Следующая картинка"
        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/85 text-muted opacity-0 transition-opacity hover:text-ink group-hover/media:opacity-100 focus-visible:opacity-100"
      >
        <ChevronRight size={16} />
      </button>
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {urls.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === selected ? 'w-4 bg-accent' : 'w-1.5 bg-bg/70'
            }`}
          />
        ))}
      </div>
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
      <div className="font-display font-semibold text-ink text-sm md:text-base">{item.title}</div>
      {item.subtitle && <div className="text-xs text-muted mt-1">{item.subtitle}</div>}
      {item.description && (
        <div className="text-xs text-muted/80 mt-2 leading-snug">{item.description}</div>
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
  return <div className={baseClass}>{body}</div>;
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
    <section className={`py-14 md:py-18 ${isCarousel ? 'bg-page-bg' : ''}`}>
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {heading && (
          <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
            {heading}
          </h2>
        )}
        {subtitle && <p className="text-center text-muted mt-3 max-w-2xl mx-auto">{subtitle}</p>}

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, [
    AutoScroll({ speed: 0.8, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length);
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <>
      <div className="relative mt-10">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4 md:-ml-5">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex-[0_0_85%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%] min-w-0 pl-4 md:pl-5"
              >
                <FeatureCard item={item} ratio="16/10" onOpen={() => onOpen(i)} />
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Предыдущий"
          className="inline-flex absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-bg border border-border text-muted hover:text-ink hover:shadow-md transition-all z-10"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Следующий"
          className="inline-flex absolute right-0 top-1/2 translate-x-3 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-bg border border-border text-muted hover:text-ink hover:shadow-md transition-all z-10"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      {snapCount > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: snapCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Слайд ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === selected ? 'w-6 bg-accent' : 'w-2 bg-border hover:bg-muted'
              }`}
            />
          ))}
        </div>
      )}
    </>
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
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[hg-fade-in_180ms_ease-out]"
    >
      <div
        role="dialog"
        aria-labelledby="feature-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-bg border border-border shadow-lg p-7"
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
            <CardMedia urls={modalUrls} alt={item.title} ratio="16/10" />
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
