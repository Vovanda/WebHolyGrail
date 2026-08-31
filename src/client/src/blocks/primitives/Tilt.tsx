'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Tilt — поверхность, которая отклоняется под указателем.
 *
 * @remarks
 * Кубик о содержимом не знает: внутрь кладут что угодно - карточку, обложку,
 * снимок. Он только считает, куда смотрит указатель относительно его середины,
 * и поворачивает содержимое вокруг неё, будто оно висит на шарнире в центре.
 *
 * Угол маленький и держится маленьким: на большом вещь перестаёт быть страницей
 * и превращается в игрушку, а текст на ней становится нечитаемым.
 *
 * Клиентский по необходимости (R14): положение указателя известно только
 * браузеру. Значения пишутся в свойства стиля напрямую, минуя состояние -
 * иначе каждое движение мыши перерисовывало бы поддерево.
 *
 * Палец работает как курсор: события указателя приходят от обоих, и отдельной
 * ветки для касания не нужно. После касания поверхность возвращается в покой -
 * пальцу некуда «уйти», и без этого она осталась бы перекошенной.
 *
 * Кто просил меньше движения - тот его не получает: наклон не включается вовсе,
 * а не включается и гасится. Настройка читается на ходу, потому что человек
 * меняет её, не перезагружая страницу.
 */
export interface TiltProps {
  readonly children: ReactNode;
  /** Наибольший угол отклонения, градусы. */
  readonly angle?: number;
  /** Насколько поверхность приподнимается под указателем, пиксели. */
  readonly lift?: number;
  /** Глубина сцены: чем меньше, тем сильнее перспектива. */
  readonly depth?: number;
  /** Сколько длится возвращение в покой, миллисекунды. */
  readonly settle?: number;
  readonly className?: string;
}

export function Tilt({
  children,
  angle = 6,
  lift = 4,
  depth = 900,
  settle = 400,
  className,
}: TiltProps) {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let idle = 0;

    const rest = () => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--tilt-lift', '0px');
      el.style.setProperty('--tilt-settle', `${settle}ms`);
    };

    const follow = (event: PointerEvent) => {
      if (calm.matches) return;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;

      // От середины: слева и сверху получается отрицательное, справа и снизу
      // положительное, по краям - ровно единица.
      const fromCenterX = (event.clientX - box.left) / box.width - 0.5;
      const fromCenterY = (event.clientY - box.top) / box.height - 0.5;

      // Указатель справа - правый край уходит от смотрящего, поэтому поворот
      // вокруг вертикали идёт по знаку смещения, а вокруг горизонтали против:
      // указатель снизу поднимает нижний край к смотрящему.
      el.style.setProperty('--tilt-y', `${fromCenterX * angle * 2}deg`);
      el.style.setProperty('--tilt-x', `${-fromCenterY * angle * 2}deg`);
      el.style.setProperty('--tilt-lift', `${lift}px`);
      // Пока указатель ведут, поверхность идёт за ним без задержки: плавность
      // нужна только на возврате, иначе движение отстаёт от руки.
      el.style.setProperty('--tilt-settle', '0ms');
    };

    const leave = () => {
      window.clearTimeout(idle);
      rest();
    };

    /*
      После касания уводим сами: палец не «уходит с поверхности», события об
      этом не приходит, и вещь осталась бы наклонённой навсегда.
    */
    const release = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(rest, 600);
    };

    rest();
    el.addEventListener('pointermove', follow);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointercancel', leave);
    el.addEventListener('pointerup', release);

    return () => {
      window.clearTimeout(idle);
      el.removeEventListener('pointermove', follow);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
      el.removeEventListener('pointerup', release);
    };
  }, [angle, lift, settle]);

  return (
    <div
      ref={frame}
      data-part="tilt"
      style={{ perspective: `${depth}px` }}
      className={cn('[transform-style:preserve-3d]', className)}
    >
      <div
        data-part="tilt-surface"
        className={cn(
          'will-change-transform',
          '[transform:rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))_translateZ(var(--tilt-lift,0px))]',
          '[transition:transform_var(--tilt-settle,400ms)_cubic-bezier(0.22,1,0.36,1)]',
          // Кто просил меньше движения - не двигается вовсе.
          'motion-reduce:[transform:none] motion-reduce:[transition:none]',
        )}
      >
        {children}
      </div>
    </div>
  );
}
