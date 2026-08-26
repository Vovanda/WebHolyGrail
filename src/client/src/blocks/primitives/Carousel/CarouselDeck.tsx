'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import AutoScroll from 'embla-carousel-auto-scroll';
import Fade from 'embla-carousel-fade';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Карусель: один контрол на все случаи листания.
 *
 * @remarks
 * Листают у нас всё - фотографии, карточки сайтов, превью блоков, видео набора.
 * Раньше каждый случай собирал своё: два почти одинаковых файла по двести строк
 * и отдельный самописный слайдер со своим свайпом. Разъезжались они быстро -
 * в одном стрелки прятались на телефоне, в другом нет.
 *
 * Здесь механика одна, а различия описываются режимом и настройками. Движок -
 * embla: жест, инерция, петля и доступность у него отлажены, и переписывать
 * это своими руками смысла нет.
 *
 * Содержимое приходит детьми. Для блоков, которые правятся в админке, поверх
 * этого примитива живут обёртки с сериализуемым описанием (R5+): сам примитив
 * в конфигурацию сайта не попадает.
 */
export type CarouselMode =
  /** По кадру во всю ширину: баннеры, фотографии. */
  | 'single'
  /** Лента карточек: видно несколько, следующая подглядывает с края. */
  | 'row';

export interface CarouselDeckProps {
  readonly children: React.ReactNode;
  /** Как показывать: кадром или лентой. */
  readonly mode?: CarouselMode;
  /** Стрелки по краям. На узком экране они мешают пальцу, поэтому только с ширины планшета. */
  readonly arrows?: boolean;
  /** Точки под лентой: сколько всего и где сейчас. */
  readonly dots?: boolean;
  /** Идти по кругу. */
  readonly loop?: boolean;
  /** Пауза между кадрами, мс. Без значения листание только руками. */
  readonly autoplay?: number | undefined;
  /**
   * Непрерывное движение вместо перещёлкивания по кадрам.
   *
   * @remarks
   * Годится витрине, которая просто едет мимо глаз. Там, где человек выбирает,
   * такое движение мешает: цель уезжает из-под пальца.
   */
  readonly marquee?: boolean;
  /** Зазор между карточками. */
  readonly gap?: 'sm' | 'md' | 'lg';
  /**
   * Чем сменяются кадры.
   *
   * @remarks
   * Сдвиг показывает, что рядом есть соседи, и подходит ленте. Затухание
   * уместно там, где кадр один и важна сама картинка - фотографии, баннеры.
   */
  readonly transition?: 'slide' | 'fade';
  /**
   * Высота ленты: любое значение CSS.
   *
   * @remarks
   * Без него высоту задаёт содержимое. Общая высота нужна, когда карточки
   * разной длины и лента иначе прыгает при листании.
   */
  readonly height?: string | undefined;
  /** Соотношение сторон кадра, например `16 / 9`. Работает вместо высоты. */
  readonly aspect?: string | undefined;
  /**
   * Отступ по краям ленты.
   *
   * @remarks
   * Держит первую и последнюю карточку на расстоянии от края экрана: без него
   * они прилипают к рамке и выглядят обрезанными.
   */
  readonly edge?: 'none' | 'sm' | 'md';
  /**
   * Какой кадр сейчас главный: лента подъезжает к нему сама.
   *
   * @remarks
   * Плеер переключил видео - лента показывает, где оно в наборе.
   */
  readonly activeIndex?: number | undefined;
  readonly className?: string | undefined;
  /** Подпись для чтения с экрана: «Фотографии», «Видео набора». */
  readonly label?: string | undefined;
}

const GAP: Record<NonNullable<CarouselDeckProps['gap']>, string> = {
  sm: 'gap-2',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 md:gap-5',
};

const EDGE: Record<NonNullable<CarouselDeckProps['edge']>, string> = {
  none: '',
  sm: 'px-3',
  md: 'px-4 md:px-6',
};

export function CarouselDeck({
  children,
  mode = 'row',
  arrows = true,
  dots = false,
  loop = false,
  autoplay,
  marquee = false,
  gap = 'md',
  transition = 'slide',
  height,
  aspect,
  edge = 'none',
  activeIndex,
  className,
  label,
}: CarouselDeckProps) {
  const plugins = [];
  if (transition === 'fade') plugins.push(Fade());
  if (marquee)
    plugins.push(AutoScroll({ speed: 1, stopOnInteraction: false, stopOnMouseEnter: true }));
  else if (autoplay)
    plugins.push(Autoplay({ delay: autoplay, stopOnInteraction: false, stopOnMouseEnter: true }));

  const [viewportRef, embla] = useEmblaCarousel(
    { loop, align: mode === 'single' ? 'center' : 'start', containScroll: 'trimSnaps' },
    plugins,
  );

  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const sync = () => {
      setCurrent(embla.selectedScrollSnap());
      setCanPrev(embla.canScrollPrev());
      setCanNext(embla.canScrollNext());
    };
    setCount(embla.scrollSnapList().length);
    sync();
    embla.on('select', sync);
    embla.on('reInit', sync);
    return () => {
      embla.off('select', sync);
      embla.off('reInit', sync);
    };
  }, [embla]);

  useEffect(() => {
    if (!embla || activeIndex === undefined) return;
    if (embla.selectedScrollSnap() !== activeIndex) embla.scrollTo(activeIndex);
  }, [embla, activeIndex]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  // Листать нечего - показываем содержимое как есть, без пустых стрелок и точек.
  const single = count <= 1;

  return (
    <div className={cn('relative', className)}>
      <div className={cn('overflow-hidden', EDGE[edge])} ref={viewportRef}>
        <div
          className={cn('flex', GAP[gap], mode === 'single' && 'items-stretch')}
          style={{ ...(height ? { height } : {}), ...(aspect ? { aspectRatio: aspect } : {}) }}
          role="group"
          aria-roledescription="carousel"
          aria-label={label}
        >
          {children}
        </div>
      </div>

      {arrows && !single && (
        <>
          <CarouselArrow side="left" onClick={prev} disabled={!loop && !canPrev} />
          <CarouselArrow side="right" onClick={next} disabled={!loop && !canNext} />
        </>
      )}

      {dots && !single && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Кадр ${i + 1}`}
              aria-current={i === current}
              className={cn(
                'h-2 rounded-full transition-all',
                i === current ? 'w-5 bg-accent' : 'w-2 bg-border hover:bg-border-strong',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Одна карточка ленты.
 *
 * @remarks
 * Ширину задаёт вызывающий: у фотографий она во весь кадр, у карточек набора -
 * своя. Прилипание живёт здесь, чтобы лента останавливалась на карточке, а не
 * между двумя.
 */
export function CarouselItem({
  children,
  className,
  width = 'auto',
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  /**
   * `full` - кадр во всю ширину ленты, `auto` - по содержимому, либо значение
   * CSS, когда у карточек своя мера: `16rem`, `70%`, `min(18rem, 80vw)`.
   */
  readonly width?: 'full' | 'auto' | string;
}) {
  const fixed = width !== 'full' && width !== 'auto' ? width : undefined;
  return (
    <div
      className={cn('min-w-0 shrink-0 grow-0', width === 'full' && 'basis-full', className)}
      style={fixed ? { flexBasis: fixed, width: fixed } : undefined}
    >
      {children}
    </div>
  );
}

function CarouselArrow({
  side,
  onClick,
  disabled,
}: {
  readonly side: 'left' | 'right';
  readonly onClick: () => void;
  readonly disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Назад' : 'Вперёд'}
      className={cn(
        // На телефоне листают пальцем, и стрелки там только закрывают картинку.
        'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center md:inline-flex',
        'rounded-full border border-border bg-bg text-muted transition-all',
        'hover:text-ink hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none',
        side === 'left' ? 'left-0 -translate-x-3' : 'right-0 translate-x-3',
      )}
    >
      {side === 'left' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
