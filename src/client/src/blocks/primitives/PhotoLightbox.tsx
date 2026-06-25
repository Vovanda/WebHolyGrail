'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

/**
 * PhotoLightbox — fullscreen-просмотр группы фотографий с zoom + swipe.
 *
 * @remarks
 * **opensource:** `yet-another-react-lightbox` (R19-compat, ~30kb gz, активный).
 * Не велосипедим (см. `holygrail-ui-reference`).
 *
 * **URL sync через hash.** При открытии: `history.pushState(null, '', '#lb=<group>/<index>')`.
 * Web-share работает через прямую ссылку. Кнопка «назад» в браузере / swipe-back
 * на мобиле → `popstate` → lightbox закрывается без перехода на предыдущую страницу.
 *
 * **Зум + свайп — встроенные плагины:** Zoom, Counter (показывает «3 / 8»).
 *
 * **Триггер: render-prop.** Компонент сам не отрисовывает картинки — отдаёт
 * через children функцию `(open) => ReactNode`. Это даёт полную свободу
 * родителю (карусель / grid / превью) — лишь бы вызвать `open(index)`.
 *
 * @example
 *   <PhotoLightbox slides={photos} groupId="dog-65923">
 *     {(open) => <Carousel slides={photos} onSlideClick={open} />}
 *   </PhotoLightbox>
 */
export interface LightboxSlide {
  readonly src: string;
  readonly alt?: string;
}

export interface PhotoLightboxProps {
  readonly slides: ReadonlyArray<LightboxSlide>;
  /** Уникальный id группы — попадает в hash для shareable-ссылки. */
  readonly groupId: string;
  readonly children: (open: (index: number) => void) => React.ReactNode;
}

export function PhotoLightbox({ slides, groupId, children }: PhotoLightboxProps) {
  const [index, setIndex] = useState<number | null>(null);
  const isOpen = index !== null;

  const lbSlides = useMemo(() => slides.map((s) => ({ src: s.src, alt: s.alt ?? '' })), [slides]);

  const open = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, i));
      setIndex(clamped);
      try {
        window.history.pushState(
          { lb: groupId, i: clamped },
          '',
          `#lb=${encodeURIComponent(groupId)}/${clamped}`,
        );
      } catch {
        /* SSR / sandbox */
      }
    },
    [slides.length, groupId],
  );

  const close = useCallback(() => {
    setIndex(null);
    // Если предыдущий state в истории был наш lightbox-push — снимаем его.
    // Иначе оставляем URL как есть (например при direct-open).
    try {
      if (window.location.hash.startsWith('#lb=')) {
        window.history.back();
      }
    } catch {
      /* */
    }
  }, []);

  // Открыть по hash на mount (deep-link).
  useEffect(() => {
    const m = window.location.hash.match(/^#lb=([^/]+)\/(\d+)$/);
    if (m && decodeURIComponent(m[1] ?? '') === groupId) {
      const i = Number(m[2]);
      if (Number.isFinite(i) && i >= 0 && i < slides.length) {
        setIndex(i);
      }
    }
  }, [groupId, slides.length]);

  // popstate → закрыть без back (которое уже произошло).
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

  // Когда юзер свайпает внутри lightbox — обновляем hash без push (replace).
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

  return (
    <>
      {children(open)}
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
          toolbar: { top: 0, right: 0, padding: '0.5rem 1rem' },
        }}
      />
    </>
  );
}
