import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import type { BlockNode, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';
import { Carousel } from './Carousel';
import { ContentFrame } from '@/layouts/ContentFrame';

/**
 * Quote / Testimonial — **первый общий компонент Holy Grail** (см. R5++).
 *
 * @remarks
 * Универсальный паттерн — цитата с подписью. Должен переноситься в любой клиент
 * без переписки кода: меняется `variant`, остальное работает.
 *
 * **Варианты дизайна (CVA):**
 *  - `card-accent-left` — editorial: border-left accent + paper-карточка
 *    + большая `❝` 78px + Cormorant italic body + Inter UPPERCASE подпись.
 *    Применение: блок «О нас», манифест-выдержка.
 *  - `minimal-modern` — без бордера, sans-serif, тонкая подпись справа. Для SaaS / визиток.
 *  - `photo-card` — фото слева/справа от текста, square-фрейм. Для отзывов клиентов.
 *
 * Дефолт — `card-accent-left`.
 * Фото-слот опционален и работает только в `photo-card` варианте.
 */
const quoteCard = cva('relative', {
  variants: {
    variant: {
      'card-accent-left': [
        'bg-surface rounded-r-xl shadow-[0_4px_14px_rgba(43,34,26,0.06)]',
        'border-l-[3px] border-accent',
        'py-7 pr-8 pl-16',
        'font-display italic font-medium text-ink',
        'text-xl md:text-2xl leading-snug',
      ],
      'minimal-modern': [
        'bg-transparent border-0 py-4',
        'font-sans text-ink text-lg leading-relaxed',
      ],
      'photo-card': [
        'bg-surface rounded-xl shadow-md',
        'p-6 font-sans text-ink text-base leading-relaxed',
      ],
      'full-width-dark': ['bg-transparent border-0', 'font-display text-dark-block-fg'],
    },
  },
  defaultVariants: { variant: 'card-accent-left' },
});

const quoteMark = cva('absolute select-none leading-none not-italic', {
  variants: {
    variant: {
      'card-accent-left':
        'left-[18px] top-[-2px] font-display font-bold text-accent text-[78px] opacity-85',
      'minimal-modern': 'hidden',
      'photo-card': 'left-3 top-1 font-display text-accent text-5xl opacity-60',
    },
  },
  defaultVariants: { variant: 'card-accent-left' },
});

const quoteCaption = cva('mt-6 not-italic', {
  variants: {
    variant: {
      'card-accent-left': 'font-sans font-bold uppercase text-[14.5px] tracking-[0.075em] text-ink',
      'minimal-modern': 'font-sans font-semibold text-sm text-muted',
      'photo-card': 'font-sans font-semibold text-sm text-ink',
    },
  },
  defaultVariants: { variant: 'card-accent-left' },
});

const quoteRole = cva('block mt-1 normal-case font-normal', {
  variants: {
    variant: {
      'card-accent-left': 'text-muted font-display italic text-[17px] tracking-normal',
      'minimal-modern': 'text-muted font-sans text-xs',
      'photo-card': 'text-muted font-sans italic text-sm',
    },
  },
  defaultVariants: { variant: 'card-accent-left' },
});

type QuoteVariantProps = VariantProps<typeof quoteCard>;

/**
 * Контракт пропсов блока — JSON-сериализуем (R5+).
 * `variant` приходит из CMS как string-литерал; компонент валидирует через CVA.
 */
export interface QuoteData {
  /** Опциональный заголовок секции над цитатой. По умолчанию пусто (нет заголовка). */
  readonly heading?: string | undefined;
  readonly body: string;
  readonly author: string;
  readonly role?: string | undefined;
  /** Опциональная ссылка из атрибуции (GitHub профиль, личный сайт). */
  readonly authorHref?: string | undefined;
  /** Одно фото (legacy). Если задан и photoUrls пустой — используется. */
  readonly photoUrl?: string | undefined;
  /** Карусель фото (новое). Перебивает photoUrl. */
  readonly photoUrls?: readonly string[] | undefined;
  readonly variant?: QuoteVariantProps['variant'] | undefined;
}

export function Quote({
  node,
  settings: _settings,
}: {
  readonly node: BlockNode & { data?: Partial<QuoteData> };
  readonly settings: SiteSettings;
}) {
  // Payload-array возвращает [{ url }, ...]; legacy в коде допускает string[].
  // Принимаем оба формата + одиночный photoUrl (старое поле).
  const rawPhotos = (node.data?.photoUrls ?? []) as readonly (string | { url?: string })[];
  const photoUrls: readonly string[] =
    rawPhotos.length > 0
      ? rawPhotos
          .map((p) => (typeof p === 'string' ? p : p?.url))
          .filter((u): u is string => Boolean(u))
      : node.data?.photoUrl
        ? [node.data.photoUrl]
        : [];

  const data: QuoteData = {
    heading: node.data?.heading,
    body: node.data?.body ?? defaultBody,
    author: node.data?.author ?? 'Lorem Ipsum',
    role: node.data?.role ?? 'Lorem ipsum dolor',
    authorHref: node.data?.authorHref,
    photoUrls,
    variant: node.data?.variant ?? 'card-accent-left',
  };

  // full-width-dark — отдельная композиция: marketing-manifesto на тёмном fullwidth
  // bg, без "О нас" heading, attribution с optional link.
  if (data.variant === 'full-width-dark') {
    return <FullWidthDarkQuote data={data} />;
  }

  const showPhotoColumn = data.variant === 'card-accent-left' || data.variant === 'photo-card';

  const figureEl = (
    <figure className={cn(quoteCard({ variant: data.variant }), 'm-0')}>
      <span aria-hidden className={quoteMark({ variant: data.variant })}>
        {'“'}
      </span>
      <blockquote className="m-0">{data.body}</blockquote>
      <figcaption className={quoteCaption({ variant: data.variant })}>
        {data.author}
        {data.role && <span className={quoteRole({ variant: data.variant })}>{data.role}</span>}
      </figcaption>
    </figure>
  );

  return (
    <section className="bg-bg pt-10 md:pt-14 pb-8 md:pb-10">
      <ContentFrame side="none" className="px-6">
        {data.heading && (
          <>
            <h2 className="text-center font-display text-3xl md:text-h2 font-semibold text-ink">
              {data.heading}
            </h2>
            <div className="mx-auto mt-4 mb-8 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
          </>
        )}

        {showPhotoColumn ? (
          <div className="grid gap-9 md:grid-cols-[3fr_2fr] items-center">
            {figureEl}
            <PhotoFrame photoUrls={data.photoUrls ?? []} alt={data.author} />
          </div>
        ) : (
          <div className="mx-auto max-w-[720px]">{figureEl}</div>
        )}
      </ContentFrame>
    </section>
  );
}

function PhotoFrame({
  photoUrls,
  alt,
}: {
  readonly photoUrls: readonly string[];
  readonly alt: string;
}) {
  if (photoUrls.length === 0) {
    return (
      <div className="relative w-full h-[380px] md:h-[460px] rounded-xl overflow-hidden bg-surface-hover border border-border flex items-center justify-center">
        <span className="text-muted font-display italic text-base px-6 text-center">
          Фото {alt}
          <br />
          <small className="text-sm">(загрузим из CMS)</small>
        </span>
      </div>
    );
  }

  return (
    <Carousel
      slides={photoUrls.map((url) => ({ url, alt }))}
      interval={5000}
      arrows
      swipe
      objectFit="cover"
      height="460px"
      background="#F3EFE7"
      rounded="14px"
      lightboxGroupId={`quote-${alt || 'photo'}`.replace(/\s+/g, '-')}
    />
  );
}

// Generic placeholder — реальный текст приходит из Payload (поле `body`).
const defaultBody =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

/**
 * Full-width dark Quote — marketing manifesto на тёмном фоне в полную ширину.
 * Центрированный большой текст + attribution (опционально как link).
 */
function FullWidthDarkQuote({ data }: { readonly data: QuoteData }) {
  return (
    <section className="bg-dark-block text-dark-block-fg py-20 md:py-28">
      <div className="mx-auto max-w-content px-4 md:px-6 text-center">
        <span aria-hidden className="font-display text-6xl text-dark-block-fg/30 leading-none">
          {'“'}
        </span>
        <blockquote className="mt-3 font-display text-xl md:text-2xl lg:text-3xl font-medium italic leading-snug text-dark-block-fg">
          {data.body}
        </blockquote>
        <div className="mt-8 text-sm md:text-base text-dark-block-fg/75">
          {'— '}
          {data.authorHref ? (
            <Link
              href={data.authorHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-dark-block-fg hover:text-accent transition-colors underline decoration-dark-block-fg/30 underline-offset-4"
            >
              {data.author}
            </Link>
          ) : (
            <span className="font-semibold text-dark-block-fg">{data.author}</span>
          )}
          {data.role && <span>, {data.role}</span>}
        </div>
      </div>
    </section>
  );
}
