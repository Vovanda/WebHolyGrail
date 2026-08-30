'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Рамка кадра, умеющая уезжать уголком.
 *
 * @remarks
 * Общая для обоих слоёв управления: окошко у них одно и то же, и держать его
 * двумя копиями значит однажды починить только одну.
 *
 * Пока уголок не нужен, это обычная рамка на своём месте. Став уголком, она
 * поднимается во всплывающий слой браузера: страница лежит в собственном слое
 * наложения, и кадр с обычным `z-index` оказывался под подвалом.
 *
 * Узел при этом остаётся там же, где стоял в разметке, - всплывающий слой
 * меняет только отрисовку. Перевесить его в конец страницы было бы проще,
 * но браузер пересобрал бы поток, и просмотр начался бы заново.
 */
export interface VideoMiniFrameProps {
  /** Показывать ли кадр уголком прямо сейчас. */
  readonly asMini: boolean;
  /** Убрать уголок до следующего раза. */
  readonly onDismiss: () => void;
  readonly className?: string | undefined;
  readonly children: React.ReactNode;
}

export function VideoMiniFrame({ asMini, onDismiss, className, children }: VideoMiniFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    /*
      Всплывающий слой поддержан не везде, и там, где его нет, кадр остаётся
      на месте обычной рамкой - хуже прежнего не становится.
    */
    if (typeof frame.showPopover !== 'function') return;

    if (asMini) {
      frame.showPopover();
      // Закрыть окошко может и сам браузер - клавишей или своим правилом.
      // Тогда состояние снаружи обязано об этом узнать, иначе уголок больше
      // не появится: снаружи он всё ещё считается открытым.
      const closed = () => {
        if (!frame.matches(':popover-open')) onDismiss();
      };
      frame.addEventListener('toggle', closed);
      return () => {
        frame.removeEventListener('toggle', closed);
        if (frame.matches(':popover-open')) frame.hidePopover();
      };
    }

    if (frame.matches(':popover-open')) frame.hidePopover();
    return;
  }, [asMini, onDismiss]);

  return (
    <div
      ref={frameRef}
      data-part={asMini ? 'mini' : 'frame'}
      {...(asMini ? { popover: 'manual' } : {})}
      // Своего вида у рамки нет: как выглядит кадр, решает слой управления.
      className={cn(className, { 'video-mini': asMini })}
    >
      {asMini && (
        <button
          type="button"
          onClick={onDismiss}
          data-part="mini-close"
          aria-label="Убрать окошко"
          /*
            Кнопка живёт внутри окошка, а не рядом с ним: во всплывающем слое
            лежит только рамка, и соседний элемент остался бы под подвалом
            вместе со страницей.
          */
          className="absolute right-1 top-1 z-10 grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-paper"
        >
          ×
        </button>
      )}
      {children}
    </div>
  );
}
