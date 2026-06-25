'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import { cn } from '@/lib/utils';
import { PhotoCountBadge } from './PhotoCountBadge';

/**
 * LightboxImageGroup — flat client-component для фото-группы с lightbox.
 *
 * @remarks
 * **Зачем не PhotoLightbox через render-prop:** server-component не может
 * передать функцию-child клиентскому (React: «Functions are not valid as a
 * child of Client Components»). Поэтому здесь — плоский API без render-prop:
 * принимает массив `photos` и сам рендерит grid + lightbox.
 *
 * **URL-shareable hash**, swipe-back закрывает модалку, Zoom + Counter
 * плагины — те же что в `PhotoLightbox`.
 *
 * **Использование:** в любых server-блоках где надо клик-открыть-lightbox
 * (PairCardGallery, PuppyCard photo, news media-grid и т.п.).
 */
export interface LightboxImageGroupProps {
  readonly photos: ReadonlyArray<{ readonly url: string; readonly alt?: string }>;
  readonly groupId: string;
  /** Класс на внешний `<div>` обёртку (grid / flex). */
  readonly containerClassName?: string;
  /** Класс на каждый `<img>` внутри. */
  readonly imgClassName?: string;
  /** Опционально — кастомные обёртки для каждого фото (например aspect-ratio cell). */
  readonly itemClassName?: string;
  /** loading для img: 'lazy' (дефолт) или 'eager'. */
  readonly loading?: 'lazy' | 'eager';
  /**
   * Показывать бейдж «📷 N» в углу первого фото когда `photos.length > 1`.
   * `auto` (дефолт) — показывает если >1. `always` — всегда. `none` — отключить.
   */
  readonly countBadge?: 'auto' | 'always' | 'none';
}

export function LightboxImageGroup({
  photos,
  groupId,
  containerClassName,
  imgClassName,
  itemClassName,
  loading = 'lazy',
  countBadge = 'auto',
}: LightboxImageGroupProps) {
  const [index, setIndex] = useState<number | null>(null);
  const isOpen = index !== null;

  const lbSlides = useMemo(() => photos.map((p) => ({ src: p.url, alt: p.alt ?? '' })), [photos]);

  const open = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(photos.length - 1, i));
      setIndex(clamped);
      try {
        window.history.pushState(
          { lb: groupId, i: clamped },
          '',
          `#lb=${encodeURIComponent(groupId)}/${clamped}`,
        );
      } catch {
        /* SSR */
      }
    },
    [photos.length, groupId],
  );

  const close = useCallback(() => {
    setIndex(null);
    try {
      if (window.location.hash.startsWith('#lb=')) {
        window.history.back();
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    const m = window.location.hash.match(/^#lb=([^/]+)\/(\d+)$/);
    if (m && decodeURIComponent(m[1] ?? '') === groupId) {
      const i = Number(m[2]);
      if (Number.isFinite(i) && i >= 0 && i < photos.length) {
        setIndex(i);
      }
    }
  }, [groupId, photos.length]);

  useEffect(() => {
    function onPop() {
      const m = window.location.hash.match(/^#lb=([^/]+)\/(\d+)$/);
      if (!m || decodeURIComponent(m[1] ?? '') !== groupId) {
        setIndex(null);
      } else {
        const i = Number(m[2]);
        if (Number.isFinite(i)) setIndex(i);
      }
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [groupId]);

  function onIndexChange(i: number) {
    setIndex(i);
    try {
      window.history.replaceState(
        { lb: groupId, i },
        '',
        `#lb=${encodeURIComponent(groupId)}/${i}`,
      );
    } catch {
      /* */
    }
  }

  if (photos.length === 0) return null;

  return (
    <>
      <div className={containerClassName}>
        {photos.map((p, i) => {
          const showBadge =
            i === 0 && (countBadge === 'always' || (countBadge === 'auto' && photos.length > 1));
          return (
            <button
              key={`${p.url}-${i}`}
              type="button"
              onClick={() => open(i)}
              aria-label={`Увеличить фото${p.alt ? ` — ${p.alt}` : ''}`}
              className={cn(
                'relative block p-0 m-0 border-0 bg-transparent cursor-zoom-in',
                itemClassName,
              )}
            >
              <img src={p.url} alt={p.alt ?? ''} loading={loading} className={imgClassName} />
              {showBadge && <PhotoCountBadge count={photos.length} />}
            </button>
          );
        })}
      </div>
      <Lightbox
        open={isOpen}
        close={close}
        slides={lbSlides}
        index={index ?? 0}
        on={{ view: ({ index: i }) => onIndexChange(i) }}
        plugins={[Zoom, Counter]}
        counter={{ container: { style: { top: 'unset', bottom: 16, left: 16 } } }}
        zoom={{ maxZoomPixelRatio: 3, doubleTapDelay: 250 }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: 'rgba(28, 22, 16, 0.92)' },
          // X — в той же позиции что бургер-меню (top-2 right-4, NavDrawer).
          toolbar: { top: 0, right: 0, padding: '0.5rem 1rem' },
        }}
      />
    </>
  );
}
