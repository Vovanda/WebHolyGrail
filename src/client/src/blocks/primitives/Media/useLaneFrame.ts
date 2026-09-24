'use client';

import { useEffect } from 'react';

import { laneFrame } from '@/lib/lane';

/**
 * Полотно ленты: одно на все кадры.
 *
 * @remarks
 * Рамка показа отдаётся разметке переменными: по её краям стоит метка листания,
 * счётчик и кнопки, к нижней границе прижата подпись.
 *
 * Считается рамка от формы окна, а не замеряется по разметке: замер ждал бы,
 * пока кадр появится и догрузится, и обвязка ехала бы всё это время.
 *
 * Хук общий у обеих лент: полотно - то же самое, чем бы снимок ни был открыт.
 */
export function useLaneFrame({
  open,
  zoomed,
  blur,
}: {
  readonly open: boolean;
  readonly zoomed: boolean;
  /** Размытая заготовка текущего кадра, если она есть. */
  readonly blur?: string | undefined;
}): void {
  useEffect(() => {
    if (!open) return undefined;

    const apply = () => {
      const frame = laneFrame({
        viewport: { width: window.innerWidth, height: window.innerHeight },
        zoomed,
      });

      const root = document.documentElement.style;
      root.setProperty('--lane-frame-width', `${frame.width}px`);
      root.setProperty('--lane-frame-height', `${frame.height}px`);
      root.setProperty('--lane-frame-left', `${frame.left}px`);
      root.setProperty('--lane-frame-right', `${frame.right}px`);
      root.setProperty('--lane-frame-bottom', `${frame.bottom}px`);
      root.setProperty('--lane-blur', blur ? `url("${blur}")` : 'none');
    };

    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      const root = document.documentElement.style;
      for (const name of [
        '--lane-frame-width',
        '--lane-frame-height',
        '--lane-frame-left',
        '--lane-frame-right',
        '--lane-frame-bottom',
        '--lane-blur',
      ]) {
        root.removeProperty(name);
      }
    };
  }, [open, zoomed, blur]);
}
