'use client';

import { useEffect, useState } from 'react';

import { LANE_ZOOM, laneZoomRatio, type FrameShape, type Viewport } from '@/lib/lane';

/** Кадр ленты так, как его видит приближение: адрес и набор с размерами. */
export interface ZoomSlide {
  readonly src: string;
  readonly srcSet?: ReadonlyArray<{ readonly width: number; readonly height: number }>;
}

/**
 * Настройки приближения для текущего кадра ленты.
 *
 * @remarks
 * Предел приближения лента считает от размера файла, и у каждого кадра он
 * выходил свой: у одного «+» срабатывал раз, у другого дважды, у мелкого
 * снимка не срабатывал вовсе. Здесь предел подгоняется под одно число
 * ступеней (`LANE_ZOOM`) - для этого нужны окно и размер файла.
 *
 * Размер файла берётся так же, как берёт его лента: наибольший из набора,
 * а без набора - натуральный размер самой картинки. Её браузер уже загрузил
 * для показа, поэтому повторного похода в сеть нет.
 */
export function useLaneZoom(slide: ZoomSlide | undefined): {
  readonly zoomInMultiplier: number;
  readonly maxZoomPixelRatio: number;
} {
  const viewport = useViewport(Boolean(slide));
  const file = useFileShape(slide);
  return {
    zoomInMultiplier: LANE_ZOOM.multiplier,
    maxZoomPixelRatio: viewport && file ? laneZoomRatio({ viewport, file }) : 1,
  };
}

function useViewport(active: boolean): Viewport | null {
  const [viewport, setViewport] = useState<Viewport | null>(null);
  useEffect(() => {
    if (!active) return undefined;
    const read = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, [active]);
  return viewport;
}

function useFileShape(slide: ZoomSlide | undefined): FrameShape | null {
  const largest = slide?.srcSet?.reduce<FrameShape | null>(
    (best, one) => (!best || one.width > best.width ? one : best),
    null,
  );
  const src = largest ? null : (slide?.src ?? null);
  const [natural, setNatural] = useState<{ src: string; shape: FrameShape } | null>(null);

  useEffect(() => {
    if (!src) return undefined;
    let live = true;
    const image = new Image();
    image.onload = () => {
      if (live)
        setNatural({ src, shape: { width: image.naturalWidth, height: image.naturalHeight } });
    };
    image.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  if (largest) return largest;
  return natural && natural.src === src ? natural.shape : null;
}
