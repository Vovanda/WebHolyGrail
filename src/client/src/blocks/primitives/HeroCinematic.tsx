import Link from 'next/link';

import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { VideoBackdrop } from './VideoBackdrop';

/**
 * HeroCinematic — обложка страницы: видео на фоне, виньетка и подписи по углам.
 *
 * @remarks
 * Кадр собран слоями: видео → виньетка → контент. Виньетка гасит края, чтобы
 * светлый кусок ролика не съел текст; за читаемость отвечает она, а не удача с
 * исходником. Поэтому текст всегда светлый и живёт в собственном слое.
 *
 * Высота задана через `min-height`, а не `height: 100vh`: на длинном контенте
 * секция растёт, а на мобильном не упирается в адресную строку браузера.
 * На узких экранах углы распрямляются в обычную колонку — четыре подписи по
 * краям там нечитаемы.
 *
 * Видео опционально: без него остаётся постер, без постера — ровный фон.
 */
export interface HeroCinematicCorner {
  readonly position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  readonly title?: string;
  readonly subtitle?: string;
  readonly emphasis?: 'large' | 'medium' | 'small';
}

export interface HeroCinematicData {
  readonly videoUrl?: string;
  readonly poster?: MediaRef | null;
  readonly logo?: MediaRef | null;
  readonly watermark?: MediaRef | null;
  readonly watermarkSide?: 'left' | 'right';
  readonly brand?: string;
  readonly headline?: string;
  readonly highlightLabel?: string;
  readonly highlightHref?: string;
  readonly quote?: string;
  readonly ctaLabel?: string;
  readonly ctaHref?: string;
  readonly corners?: readonly HeroCinematicCorner[];
}

const EMPHASIS_CLASS: Record<NonNullable<HeroCinematicCorner['emphasis']>, string> = {
  large: 'text-xs md:text-xl font-semibold',
  medium: 'text-xs md:text-lg font-medium',
  small: 'text-[11px] md:text-base font-normal',
};

/** Уголки рамки рисуются псевдоэлементами: две линии сходятся в свой угол. */
const FRAME_CLASS: Record<NonNullable<HeroCinematicCorner['position']>, string> = {
  'top-left':
    'text-left before:top-0 before:left-0 before:h-[3px] before:w-10 md:before:w-14 after:top-0 after:left-0 after:h-10 md:after:h-14 after:w-[3px]',
  'top-right':
    'text-right before:top-0 before:right-0 before:h-[3px] before:w-10 md:before:w-14 after:top-0 after:right-0 after:h-10 md:after:h-14 after:w-[3px]',
  'bottom-left':
    'text-left before:bottom-0 before:left-0 before:h-[3px] before:w-10 md:before:w-14 after:bottom-0 after:left-0 after:h-10 md:after:h-14 after:w-[3px]',
  'bottom-right':
    'text-right before:bottom-0 before:right-0 before:h-[3px] before:w-10 md:before:w-14 after:bottom-0 after:right-0 after:h-10 md:after:h-14 after:w-[3px]',
};

function mediaUrl(ref: MediaRef | null | undefined): string | undefined {
  if (!ref || typeof ref !== 'object') return undefined;
  return (ref as { url?: string }).url;
}

function Corner({ corner }: { readonly corner: HeroCinematicCorner }) {
  const position = corner.position ?? 'top-left';
  const emphasis = corner.emphasis ?? 'medium';
  return (
    <div
      className={[
        'relative inline-block w-[46%] max-w-[150px] px-3 py-2.5 uppercase leading-snug tracking-wide text-accent md:w-auto md:max-w-[220px] md:px-4 md:py-3',
        'before:absolute before:bg-accent before:content-[""] after:absolute after:bg-accent after:content-[""]',
        EMPHASIS_CLASS[emphasis],
        FRAME_CLASS[position],
      ].join(' ')}
    >
      {corner.title}
      {corner.subtitle && (
        <span className="mt-1 block text-[11px] font-normal normal-case leading-tight tracking-normal text-white/90 md:mt-1.5 md:text-sm">
          {corner.subtitle}
        </span>
      )}
    </div>
  );
}

export function HeroCinematic({
  node,
}: {
  readonly node: BlockNode & { data?: HeroCinematicData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const corners = data.corners ?? [];
  const poster = mediaUrl(data.poster);
  const at = (position: HeroCinematicCorner['position']) =>
    corners.find((c) => (c.position ?? 'top-left') === position);

  const highlight = data.highlightLabel && (
    <span className="mt-2 block text-3xl text-[color:var(--color-danger)] md:text-4xl">
      {data.highlightLabel}
    </span>
  );

  return (
    <section className="relative w-full overflow-hidden bg-dark-block">
      {data.videoUrl && <VideoBackdrop src={data.videoUrl} {...(poster ? { poster } : {})} />}
      {!data.videoUrl && poster && (
        // eslint-disable-next-line @next/next/no-img-element -- фон обложки, размеры задаёт секция
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Знак фоном: крупно, приглушённо, наполовину за краем кадра — читается
          как фактура, а не как ещё один элемент, спорящий с заголовком.
          Прячем на узких экранах: там он налезает на текст. */}
      {mediaUrl(data.watermark) && (
        // eslint-disable-next-line @next/next/no-img-element -- декоративный слой, размеры задаёт секция
        <img
          src={mediaUrl(data.watermark)}
          alt=""
          aria-hidden="true"
          className={[
            'pointer-events-none absolute top-1/2 hidden w-[46%] max-w-[560px] -translate-y-1/2 opacity-[0.14] mix-blend-luminosity md:block',
            (data.watermarkSide ?? 'right') === 'left' ? '-left-[8%]' : '-right-[8%]',
          ].join(' ')}
        />
      )}

      {/* Виньетка: гасит края кадра, чтобы текст читался поверх любого видео.
          Цвет — из палитры, а не жёсткий чёрный: на чёрно-золотом сайте края
          уходят в тёплый чёрный бренда, на синем — в синий.

          Градиент задан inline, а не классом: Tailwind не разбирает запятые
          внутри вложенного color-mix() и молча не выдаёт правило — виньетка
          просто исчезает. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, color-mix(in srgb, var(--color-dark-block) 80%, transparent) 70%, var(--color-dark-block) 100%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-wide flex-col gap-6 px-4 py-8 md:min-h-[87vh] md:gap-0 md:px-6">
        <div className="flex items-start justify-between gap-3 md:gap-4">
          {at('top-left') && <Corner corner={at('top-left')!} />}
          {at('top-right') && <Corner corner={at('top-right')!} />}
        </div>

        {mediaUrl(data.logo) ? (
          // Знак проекта вместо надписи: на главной бренд узнаётся по логотипу,
          // а не по набранному вразрядку названию.
          // eslint-disable-next-line @next/next/no-img-element -- источник S3 нашей CMS
          <img
            src={mediaUrl(data.logo)}
            alt={data.brand ?? ''}
            className="mx-auto my-4 w-60 max-w-[82%] md:w-[26rem]"
          />
        ) : null}

        {!mediaUrl(data.logo) && data.brand && (
          <p className="py-2 text-center font-display text-3xl font-black uppercase tracking-[0.15em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)] md:text-5xl">
            {data.brand}
          </p>
        )}

        <div className="flex flex-grow items-center py-4 md:px-[6%]">
          <h1 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-accent [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] md:text-4xl">
            {data.headline}
            {data.highlightHref ? (
              <Link href={data.highlightHref} className="no-underline hover:opacity-80">
                {highlight}
              </Link>
            ) : (
              highlight
            )}
          </h1>
        </div>

        {data.quote && (
          <blockquote className="mx-auto max-w-3xl border-y-2 border-accent py-4 text-center text-base leading-relaxed text-white/95 md:text-lg">
            {data.quote}
          </blockquote>
        )}

        {data.ctaLabel && data.ctaHref && (
          <div className="py-4 text-center">
            <Link
              href={data.ctaHref}
              className="inline-block border-2 border-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-accent transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-accent-fg md:px-11 md:py-4"
            >
              {data.ctaLabel}
            </Link>
          </div>
        )}

        <div className="flex items-end justify-between gap-3 md:gap-4">
          {at('bottom-left') && <Corner corner={at('bottom-left')!} />}
          {at('bottom-right') && <Corner corner={at('bottom-right')!} />}
        </div>
      </div>
    </section>
  );
}
