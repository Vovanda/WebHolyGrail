'use client';

import type { Puppy } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { DetailDrawer } from '@/blocks/primitives/DetailDrawer';

/**
 * PuppyDetailDrawer — модалка-карточка щенка, выезжает слева.
 *
 * Триггер открытия: на родительской странице кнопка/ссылка делает
 * `openDetail(\`puppy:\${litterId}:\${puppy.id}\`)`. Здесь мы рендерим
 * соответствующий DetailDrawer с slug совпадающим.
 *
 * Контент: hero-фото + статус + детальная инфо + кнопка «Подробнее → страница
 * помёта». В будущем — карусель фото + бронь / forms.
 */
export interface PuppyDetailDrawerProps {
  readonly puppy: Puppy;
  readonly photoUrl?: string;
  readonly photoAlt?: string;
  readonly label: string;
  readonly stateLabel?: string;
  readonly detailHref?: string;
  readonly slug: string;
}

export function PuppyDetailDrawer({
  puppy,
  photoUrl,
  photoAlt,
  label,
  stateLabel,
  detailHref,
  slug,
}: PuppyDetailDrawerProps) {
  return (
    <DetailDrawer slug={slug}>
      <div className="pb-10">
        {photoUrl ? (
          <div className="relative w-full aspect-[4/5] bg-[#F3EFE7]">
            <img
              src={photoUrl}
              alt={photoAlt ?? label}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/5] bg-[#F3EFE7] flex items-center justify-center text-muted font-display italic">
            Фото скоро
          </div>
        )}

        <div className="px-6 md:px-8 pt-6">
          <h2 className="font-display text-2xl font-semibold text-ink leading-tight">{label}</h2>
          {stateLabel && (
            <p
              className={cn(
                'mt-2 inline-flex items-center px-3 py-1 rounded-full',
                'text-[12.5px] font-semibold uppercase tracking-[0.4px]',
                puppy.state === 'sold'
                  ? 'bg-muted/15 text-muted'
                  : puppy.state === 'reserved'
                    ? 'bg-accent-soft text-accent-dark'
                    : 'bg-success-soft text-success',
              )}
            >
              {stateLabel}
            </p>
          )}

          {puppy.notes && (
            <p className="mt-4 font-display italic text-muted text-[15px] leading-relaxed">
              {puppy.notes}
            </p>
          )}

          {detailHref && (
            <a
              href={detailHref}
              className={cn(
                'mt-6 inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5',
                'bg-accent text-paper rounded-full font-bold text-[14px] no-underline',
                'transition-colors hover:bg-accent-dark',
              )}
            >
              Подробнее →
            </a>
          )}
        </div>
      </div>
    </DetailDrawer>
  );
}
