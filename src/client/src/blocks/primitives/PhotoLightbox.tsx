'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import { parseLaneHash } from '@/lib/lane-hash';

import { LaneOverlay } from './Media/LaneOverlay';
import { leaveLane, pushLane, replaceLane } from './Media/lane-history';
import { LANE_PROPS } from './Media/lane-look';
import { useLaneFrame } from './Media/useLaneFrame';
import { useLaneZoom } from './Media/useLaneZoom';

/** Кадр группы: адрес и подпись для тех, кто его не видит. */
export interface LightboxSlide {
  readonly src: string;
  readonly alt?: string;
}

export interface PhotoLightboxProps {
  readonly slides: ReadonlyArray<LightboxSlide>;
  /** Имя группы - оно попадает в адрес, поэтому ссылку можно переслать. */
  readonly groupId: string;
  readonly children: (open: (index: number) => void) => React.ReactNode;
}

/**
 * Лента своей группы снимков: карусель, карточка, окно услуги.
 *
 * @remarks
 * Показывает не всю страницу, а ровно те кадры, что ей передали, - этим
 * и отличается от ленты страницы. Вид у обеих один: полотно, стёклышки кнопок,
 * зоны листания во всю высоту. Владелец видит один сайт, и второй повадки
 * у показа быть не должно.
 *
 * Открывается по адресу: при открытии в адрес уходит `#lb=<группа>/<номер>`,
 * поэтому ссылку можно переслать, а кнопка «назад» закрывает ленту, а не
 * уводит со страницы.
 *
 * Показ отдаётся вызывающему: компонент сам картинок не рисует, а даёт
 * функцию открытия. Что нажимать - карусель, плитку или одну картинку -
 * решает тот, кто ставит.
 *
 * @example
 *   <PhotoLightbox slides={photos} groupId="dog-65923">
 *     {(open) => <PhotoDeck slides={photos} onPick={open} />}
 *   </PhotoLightbox>
 */
export function PhotoLightbox({ slides, groupId, children }: PhotoLightboxProps) {
  const [index, setIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const isOpen = index !== null;

  const lbSlides = useMemo(() => slides.map((s) => ({ src: s.src, alt: s.alt ?? '' })), [slides]);

  useLaneFrame({ open: isOpen, zoomed });

  const open = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, i));
      setIndex(clamped);
      setZoomed(false);
      pushLane(groupId, clamped);
    },
    [slides.length, groupId],
  );

  const close = useCallback(() => {
    setIndex(null);
    leaveLane();
  }, []);

  // Открытая по присланной ссылке страница показывает ленту сразу.
  useEffect(() => {
    const at = parseLaneHash(window.location.hash);
    if (at?.group === groupId && at.index < slides.length) setIndex(at.index);
  }, [groupId, slides.length]);

  // Кнопка «назад» и движение пальцем от края закрывают ленту, а не уводят
  // со страницы.
  useEffect(() => {
    function onPop() {
      const at = parseLaneHash(window.location.hash);
      setIndex(at?.group === groupId ? at.index : null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [groupId]);

  // Листание меняет адрес на месте: шаг назад тогда закрывает ленту, а не
  // отматывает её по кадру.
  function onIndexChange(i: number) {
    setIndex(i);
    setZoomed(false);
    replaceLane(groupId, i);
  }

  const shown = index !== null ? slides[index] : undefined;
  const zoom = useLaneZoom(index !== null ? lbSlides[index] : undefined);

  return (
    <>
      {children(open)}
      {isOpen && (
        <>
          <Lightbox
            {...LANE_PROPS}
            zoom={zoom}
            open
            close={close}
            slides={lbSlides}
            index={index}
            on={{
              view: ({ index: i }) => onIndexChange(i),
              // Полотно снимается на первом же увеличении и возвращается,
              // когда масштаб пришёл обратно к единице.
              zoom: ({ zoom }) => setZoomed(zoom > 1),
            }}
            controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
            render={{
              controls: () =>
                shown ? (
                  <LaneOverlay
                    shot={{
                      src: shown.src,
                      set: [],
                      file: shown.src,
                      blur: '',
                      alt: shown.alt ?? '',
                      title: '',
                      note: '',
                      width: 0,
                      height: 0,
                    }}
                  />
                ) : null,
            }}
          />
        </>
      )}
    </>
  );
}
