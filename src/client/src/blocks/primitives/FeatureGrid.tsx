'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { CarouselDeck, CarouselItem } from '@/blocks/arrangements/Carousel';
import { MediaImage } from '@/blocks/primitives/Media';
import { CardRows } from '@/blocks/arrangements/CardRows';
import { CARD_PLACE, resolveMediaUrl } from '@/lib/media';
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
  /** Раскладка плиток именами областей: «a b c e : a b d d». Пусто - считается сама. */
  readonly tileLayout?: string | null;
  readonly tileLayoutMd?: string | null;
  readonly tileLayoutSm?: string | null;
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

/**
 * Картинки карточки документами медиатеки.
 *
 * @remarks
 * Документ, а не адрес: по нему показ берёт ступень под размер карточки,
 * а из строки этого не узнать - в карточку шириной в треть ряда уезжал кадр
 * с телефона целиком.
 */
function imagesOf(item: FeatureItem): readonly MediaRef[] {
  return (item.images ?? [])
    .map((entry) => entry.image)
    .filter((image): image is MediaRef => Boolean(image));
}

/** Сетка держит карточку узкой — там 4/3 экономит высоту; в карусели карточка
 * шире и несёт превью страниц, для них привычнее 16/10. */
type MediaRatio = '4/3' | '16/10';

/* Окно услуги ограничено своей шириной и на большом экране не растёт. */
const MODAL_PLACE = '(max-width: 768px) 100vw, 448px';

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
  images,
  place,
  alt,
  ratio,
  natural = false,
  onPick,
  frameHref,
  frameExternal = false,
}: {
  readonly images: readonly MediaRef[];
  /** Сколько места кадр занимает на экране: знает про это тот, кто ставит карточку. */
  readonly place: string;
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
  /**
   * Куда ведёт сам кадр.
   *
   * @remarks
   * Лента лежит выше слоя, который делает карточку нажимаемой целиком, иначе
   * стрелки не поймали бы ни указателя, ни нажатия. Поэтому кадру ссылку
   * приходится отдавать отдельно - без неё нажатие на картинку ничего бы
   * не делало, хотя вся карточка вокруг ведёт на страницу.
   */
  readonly frameHref?: string;
  readonly frameExternal?: boolean;
}) {
  const ratioClass = natural ? '' : RATIO_CLASS[ratio];

  const picture = (image: MediaRef, i: number) => {
    const frame = (
      <MediaImage
        media={image}
        place={place}
        alt={alt}
        fit={natural ? 'contain' : 'cover'}
        zoom={false}
        className={
          natural ? `w-full ${onPick ? 'cursor-zoom-in' : ''}` : 'h-full w-full object-cover'
        }
      />
    );
    /*
      Открытие крупно ведёт сама карточка: своё окно с лентой у неё уже есть,
      и кубику открытие отключено, чтобы за одно нажатие не брались два показа.
    */
    const img = onPick ? (
      <span
        data-part="card-media"
        role="button"
        tabIndex={0}
        onClick={() => onPick(i)}
        className={cn('block', natural ? 'w-full' : 'h-full w-full')}
      >
        {frame}
      </span>
    ) : (
      <span data-part="card-media" className={cn('block', natural ? 'w-full' : 'h-full w-full')}>
        {frame}
      </span>
    );
    if (!frameHref) return img;
    return (
      <Link
        href={frameHref}
        {...(frameExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-label={alt}
        tabIndex={-1}
        className="block h-full w-full"
      >
        {img}
      </Link>
    );
  };

  if (images.length <= 1) {
    return (
      <div className={`${ratioClass} overflow-hidden bg-surface`}>{picture(images[0]!, 0)}</div>
    );
  }

  return (
    /* Лента лежит выше слоя, которым нажимается карточка целиком: иначе слой
       перехватывал бы и указатель, и нажатие, а стрелки не проявлялись бы. */
    <div className="relative z-10 overflow-hidden bg-surface">
      <CarouselDeck
        mode="single"
        loop
        arrows
        dots
        controls="overlay"
        label={alt}
        {...(natural ? {} : { aspect: RATIO_VALUE[ratio] })}
      >
        {images.map((image, i) => (
          <CarouselItem key={i} width="full">
            {picture(image, i)}
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
  onOpen,
}: {
  readonly item: FeatureItem;
  readonly ratio: MediaRatio;
  readonly onOpen: () => void;
}) {
  const images = imagesOf(item);
  const href = item.href?.trim();

  const body = (
    <>
      {images.length > 0 ? (
        <div data-part="card-media" className="-mx-5 -mt-5 mb-4">
          <CardMedia
            images={images}
            place={CARD_PLACE}
            alt={item.title}
            ratio={ratio}
            {...(item.details
              ? { onPick: onOpen }
              : href
                ? { frameHref: href, frameExternal: isExternal(href) }
                : {})}
          />
        </div>
      ) : null}
      {/*
        Содержимое стоит по середине оставшейся высоты: карточка, растянутая
        раскладкой через два ряда, иначе держала бы текст у верхнего края,
        а под ним зияла пустота. Картинка в эту группу не входит - она прижата
        к верхнему краю карточки, иначе отошла бы от него.
      */}
      <div data-part="card-content" className="flex flex-1 flex-col justify-center">
        {images.length === 0 && (
          <div data-part="card-icon" className="mx-auto mb-3">
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
          lang="ru"
          /* Длинное название разрывается по слогам, а совсем длинное слово -
           в любом месте: иначе «Металлоконструкции и перегородки» вылезали
           за край карточки в ландшафте телефона. */
          className="font-display font-semibold text-ink text-sm md:text-base hyphens-auto break-words"
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
      </div>
    </>
  );

  const baseClass =
    'relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-bg p-5 text-center hover:shadow-md transition-shadow';
  const interactiveClass = `${baseClass} group cursor-pointer hover:border-accent/40 text-inherit`;
  /*
    Нажатие на карточку целиком берёт отдельный слой поверх содержимого, а не
    сама карточка: внутри неё живут стрелки и точки галереи, а кнопка в кнопке
    и ссылка вокруг кнопки - разметка, которую браузер не принимает. Слой лежит
    ниже органов управления, поэтому листание достаётся им.
  */
  const coverClass = 'absolute inset-0 z-0';

  if (item.details) {
    return (
      <div data-part="card" className={interactiveClass}>
        {body}
        <button
          type="button"
          onClick={onOpen}
          className={coverClass}
          aria-label={`Подробнее: ${item.title}`}
        />
      </div>
    );
  }
  if (href) {
    const external = isExternal(href);
    const Arrow = external ? ArrowUpRight : ArrowRight;
    return (
      <div data-part="card" className={interactiveClass}>
        {body}
        <Arrow
          size={16}
          aria-hidden="true"
          className="absolute top-4 right-4 text-muted/60 group-hover:text-accent transition-colors"
        />
        <Link
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={coverClass}
          aria-label={item.title}
        />
      </div>
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

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="block-space">
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

        <CardRows
          items={items}
          columns={3}
          tileLayout={data.tileLayout}
          tileLayoutMd={data.tileLayoutMd}
          tileLayoutSm={data.tileLayoutSm}
          className="mt-10 md:mt-12"
        >
          {(item, i) => <FeatureCard item={item} ratio="4/3" onOpen={() => setOpenIdx(i)} />}
        </CardRows>
      </div>
      {openIdx !== null && items[openIdx] && (
        <FeatureModal item={items[openIdx]!} onClose={() => setOpenIdx(null)} />
      )}
    </section>
  );
}

function FeatureModal({
  item,
  onClose,
}: {
  readonly item: FeatureItem;
  readonly onClose: () => void;
}) {
  const modalImages = imagesOf(item);

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
        {modalImages.length > 0 ? (
          <div className="mb-5 -mx-7 -mt-7 overflow-hidden rounded-t-2xl">
            {/* Картинка услуги — это афиша с текстом: в модалке он мелкий, а по
                клику открывается во весь экран с зумом. */}
            <PhotoLightbox
              slides={modalImages.map((image) => ({
                src: resolveMediaUrl(image) ?? '',
                alt: item.title,
              }))}
              groupId={`feature-${item.title}`}
            >
              {(open) => (
                <CardMedia
                  images={modalImages}
                  place={MODAL_PLACE}
                  alt={item.title}
                  ratio="16/10"
                  natural
                  onPick={open}
                />
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
