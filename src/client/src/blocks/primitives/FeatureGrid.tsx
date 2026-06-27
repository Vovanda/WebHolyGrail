'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

import { BrandIcon } from './StackTransparency';

/**
 * FeatureGrid — сетка карточек с иконкой/заголовком/описанием.
 * При наличии `details` карточка становится кликабельной → modal с детальным
 * описанием почему это решение хорошо.
 *
 * 'use client' нужен для state модалки (open/close + Esc).
 */

export interface FeatureGridData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly items?: readonly {
    readonly icon: string;
    readonly title: string;
    readonly subtitle?: string;
    readonly description?: string;
    readonly details?: string;
  }[];
}

type FeatureItem = NonNullable<FeatureGridData['items']>[number];

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

  // 7 items → 2-3-2 шахматка на desktop (6-col grid).
  const isSevenCheckerboard = items.length === 7;

  return (
    <section className="py-14 md:py-18">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {heading && (
          <h2 className="text-center font-display text-h3 md:text-h2 font-semibold text-ink">
            {heading}
          </h2>
        )}
        {subtitle && <p className="text-center text-muted mt-3 max-w-2xl mx-auto">{subtitle}</p>}
        <div
          className={
            isSevenCheckerboard
              ? 'mt-10 md:mt-12 grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : `mt-10 md:mt-12 grid gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 ${
                  items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                }`
          }
        >
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            const hangingMobile = isLast && items.length % 2 === 1 ? 'col-span-2' : '';
            const hangingSm = isLast && items.length % 3 === 1 ? 'sm:col-span-3' : '';
            const lgSpan = isSevenCheckerboard
              ? i < 2 || i > 4
                ? 'lg:col-span-3'
                : 'lg:col-span-2'
              : '';
            const spanClass = [hangingMobile, hangingSm, lgSpan].filter(Boolean).join(' ');
            const hasDetails = Boolean(item.details);

            const cardBody = (
              <>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent-soft p-2">
                  <BrandIcon icon={item.icon} label={item.title} size={28} />
                </div>
                <div className="font-display font-semibold text-ink text-sm md:text-base">
                  {item.title}
                </div>
                {item.subtitle && <div className="text-xs text-muted mt-1">{item.subtitle}</div>}
                {item.description && (
                  <div className="text-xs text-muted/80 mt-2 leading-snug">{item.description}</div>
                )}
              </>
            );

            const baseClass = `rounded-xl border border-border bg-bg p-5 text-center hover:shadow-md transition-shadow ${spanClass}`;

            if (hasDetails) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenIdx(i)}
                  className={`${baseClass} cursor-pointer hover:border-accent/40 text-inherit`}
                  aria-label={`Подробнее: ${item.title}`}
                >
                  {cardBody}
                </button>
              );
            }
            return (
              <div key={i} className={baseClass}>
                {cardBody}
              </div>
            );
          })}
        </div>
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
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent-soft p-2">
          <BrandIcon icon={item.icon} label={item.title} size={28} />
        </div>
        <h3 id="feature-modal-title" className="font-display text-xl font-semibold text-ink">
          {item.title}
        </h3>
        {item.subtitle && <div className="text-sm text-muted mt-1">{item.subtitle}</div>}
        {item.details && (
          <p className="mt-4 text-sm text-ink/85 leading-relaxed whitespace-pre-line">
            {item.details}
          </p>
        )}
      </div>
    </div>
  );
}
