'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
 * Листают у нас всё - фотографии, карточки сайтов, превью блоков, видео плейлиста.
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
  /**
   * Где стоят стрелки и точки.
   *
   * @remarks
   * `outside` - за краем ленты и под ней: место есть, ничего не закрывается.
   *
   * `overlay` - поверх самого кадра, мельче и полупрозрачно. Нужно там, где
   * лента вставлена в чужую рамку и вокруг неё места нет: картинка в карточке,
   * баннер во всю ширину. Стрелки там появляются под указателем, а пальцем
   * листают жестом.
   */
  readonly controls?: 'outside' | 'overlay';
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
  /**
   * Насколько быстро идёт непрерывное движение.
   *
   * @remarks
   * Значение из embla: единица - привычный ход витрины. Меньше единицы читается
   * как медленное течение, больше - как бегущая строка. Без непрерывного
   * движения не значит ничего.
   */
  readonly speed?: number;
  /**
   * Останавливаться ли, когда на ленту навели указатель.
   *
   * @remarks
   * По умолчанию да: человек подвёл курсор - значит присматривается, и уезжающая
   * из-под него карточка раздражает. Витрине, которая едет фоном и ничего
   * не предлагает выбирать, остановка ни к чему.
   */
  readonly pauseOnHover?: boolean;
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
   * Держит первую и последнюю карточку на расстоянии от края: без него они
   * прилипают к рамке и выглядят обрезанными.
   *
   * `gap` - тот же отступ, что и между карточками. Так лента читается ровной:
   * расстояние одинаковое и между соседями, и до краёв.
   */
  readonly edge?: 'none' | 'gap' | 'sm' | 'md';
  /**
   * Какой кадр сейчас главный: лента подъезжает к нему сама.
   *
   * @remarks
   * Плеер переключил видео - лента показывает, где оно в плейлисте.
   */
  readonly activeIndex?: number | undefined;
  readonly className?: string | undefined;
  /** Подпись для чтения с экрана: «Фотографии», «Видео плейлиста». */
  readonly label?: string | undefined;
}

/*
  Зазор несёт сама карточка, а полоса гасит лишний отступ у первой.

  Свойством gap его задавать нельзя: оно работает между соседями по разметке,
  а в круге движок разметку не переставляет - он уносит первые карточки сдвигом
  в конец ленты. Там, где карточка встала физически, соседства по разметке нет,
  и на стыке зазор пропадал: между соседями двадцать точек, а между последней
  и первой ноль. Отступ на самой карточке едет вместе с ней, куда бы её ни унесло.

  Отступ внутренний, а не внешний: движок считает ширину карточки по её основе,
  и внешнее поле в неё не входит - в круге смещение уезжало ровно на один зазор,
  и первая карточка вставала вплотную к краю окна. Набивка в основу входит,
  поэтому счёт сходится. Ровно так это описано в документации движка.
*/

const EDGE: Record<NonNullable<CarouselDeckProps['edge']>, string> = {
  none: '',
  gap: '',
  sm: 'px-3',
  md: 'px-4 md:px-6',
};

export function CarouselDeck({
  children,
  mode = 'row',
  arrows = true,
  dots = false,
  controls = 'outside',
  loop = false,
  autoplay,
  marquee = false,
  speed = 1,
  pauseOnHover = true,
  gap = 'md',
  transition = 'slide',
  height,
  aspect,
  edge = 'none',
  activeIndex,
  className,
  label,
}: CarouselDeckProps) {
  /*
    Набор дополнений считается один раз. Собранный заново при каждой перерисовке,
    он заставлял движок заводиться заново, а самоход после перезавода стоял
    на месте: примитив запоминает число кадров сразу после первого показа, так что
    перерисовка случается всегда - и лента, которой задано непрерывное движение,
    не трогалась вовсе.
  */
  const plugins = useMemo(() => {
    const list = [];
    if (transition === 'fade') list.push(Fade());
    if (marquee)
      list.push(AutoScroll({ speed, stopOnInteraction: false, stopOnMouseEnter: pauseOnHover }));
    else if (autoplay)
      list.push(
        Autoplay({ delay: autoplay, stopOnInteraction: false, stopOnMouseEnter: pauseOnHover }),
      );
    return list;
  }, [transition, marquee, speed, pauseOnHover, autoplay]);

  const options = useMemo(
    () => ({
      loop,
      align: mode === 'single' ? ('center' as const) : ('start' as const),
      containScroll: 'trimSnaps' as const,
    }),
    [loop, mode],
  );

  const [viewportRef, embla] = useEmblaCarousel(options, plugins);

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

  const [fits, setFits] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const measure = () => {
      const viewport = embla.rootNode();
      const slides = embla.slideNodes();
      const width = slides.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0);
      setFits(width <= viewport.clientWidth + 1);
    };
    measure();
    embla.on('reInit', measure);
    embla.on('resize', measure);
    return () => {
      embla.off('reInit', measure);
      embla.off('resize', measure);
    };
  }, [embla]);

  // Ход останавливается там же: уместившейся ленте ехать некуда.
  useEffect(() => {
    if (!embla) return;
    const auto = embla.plugins().autoScroll ?? embla.plugins().autoplay;
    if (!auto) return;
    if (fits) auto.stop();
    else if (!auto.isPlaying()) auto.play();
  }, [embla, fits]);

  useEffect(() => {
    if (!embla || activeIndex === undefined) return;
    if (embla.selectedScrollSnap() !== activeIndex) embla.scrollTo(activeIndex);
  }, [embla, activeIndex]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);

  // Листать нечего - показываем содержимое как есть, без пустых стрелок и точек.
  /*
    Листать некуда - стрелок нет. Считать по числу карточек нельзя: четыре
    штуки помещаются в ленту целиком, и стрелки при них только мешают.
    Признаки приходят от самой ленты и учитывают её настоящую ширину.
  */
  const single = count <= 1;
  /*
    Инвариант: если плитки со своими отступами умещаются в окно целиком,
    листать нечего. Тогда лишние и стрелки, и точки, и ход - иначе лента
    дёргается на месте: в круге движок мечется между двумя положениями,
    а на глаз это читается как рывки влево-вправо.

    Признак не от числа плиток, а от их настоящей ширины: одна и та же лента
    умещается на широком экране и не умещается на среднем.
  */
  const scrollable = !fits && (loop || canPrev || canNext);

  return (
    <div
      data-part="carousel"
      data-gap={gap}
      className={cn('relative', controls === 'overlay' && 'group/deck', className)}
    >
      <div
        data-part="carousel-viewport"
        className={cn('overflow-hidden', edge === 'gap' ? 'px-[var(--carousel-gap)]' : EDGE[edge])}
        ref={viewportRef}
      >
        <div
          /* Карточки тянутся до общей высоты: иначе соседи разной длины дают
             рваный нижний край ленты. */
          data-part="carousel-track"
          className={cn(
            'flex items-stretch',
            // Зазор берётся из переменной, а не из класса: так его переопределяют
            // видом блока - той же строкой «свойство: значение», что и отступы.
            '-ml-[var(--carousel-gap)] [&>*]:pl-[var(--carousel-gap)]',
          )}
          style={{ ...(height ? { height } : {}), ...(aspect ? { aspectRatio: aspect } : {}) }}
          role="group"
          aria-roledescription="carousel"
          aria-label={label}
        >
          {children}
        </div>
      </div>

      {arrows && !single && scrollable && (
        <>
          <CarouselArrow
            side="left"
            onClick={prev}
            disabled={!loop && !canPrev}
            controls={controls}
          />
          <CarouselArrow
            side="right"
            onClick={next}
            disabled={!loop && !canNext}
            controls={controls}
          />
        </>
      )}

      {dots && !single && !fits && (
        <div
          data-part="carousel-dots"
          className={cn(
            'flex justify-center',
            controls === 'overlay'
              ? 'pointer-events-none absolute inset-x-0 bottom-2 z-10 gap-1.5'
              : 'mt-4 gap-2',
          )}
        >
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              data-part="carousel-dot"
              onClick={(e) => {
                stopClick(e);
                embla?.scrollTo(i);
              }}
              aria-label={`Кадр ${i + 1}`}
              aria-current={i === current}
              className={cn(
                'rounded-full transition-all',
                controls === 'overlay' ? 'pointer-events-auto h-1.5' : 'h-2',
                i === current
                  ? cn('bg-accent', controls === 'overlay' ? 'w-4' : 'w-5')
                  : controls === 'overlay'
                    ? 'w-1.5 bg-bg/70'
                    : 'w-2 bg-border hover:bg-border-strong',
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
 * Ширину задаёт вызывающий: у фотографий она во весь кадр, у карточек плейлиста -
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
  /*
    Заданная мера - это видимая ширина плитки. Зазор живёт набивкой внутри неё,
    поэтому к основе он добавляется отдельно: иначе плитки молча ужимались бы
    на его величину, лента из шести кадров вдруг умещалась бы в окно целиком,
    и движок схлопывал бы положения - на глаз это читалось как дёрганье ленты
    влево-вправо на месте.
  */
  const fixed =
    width !== 'full' && width !== 'auto' ? `calc(${width} + var(--carousel-gap))` : undefined;
  return (
    <div
      data-part="carousel-item"
      className={cn(
        // Карточка занимает всю высоту ленты, а содержимое внутри тянется до
        // её низа: так у ряда ровный край независимо от длины подписей.
        'flex min-w-0 shrink-0 grow-0 [&>*]:h-full [&>*]:w-full',
        width === 'full' && 'basis-full',
        className,
      )}
      style={fixed ? { flexBasis: fixed, width: fixed } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Нажатие на орган управления никуда не всплывает.
 *
 * @remarks
 * Ленту вставляют и в карточку, которая целиком ссылка. Без этого нажатие
 * на стрелку листало бы кадр и заодно уводило со страницы.
 */
function stopClick(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function CarouselArrow({
  side,
  onClick,
  disabled,
  controls,
}: {
  readonly side: 'left' | 'right';
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly controls: NonNullable<CarouselDeckProps['controls']>;
}) {
  const overlay = controls === 'overlay';
  return (
    <button
      type="button"
      data-part="carousel-arrow"
      data-side={side}
      onClick={(e) => {
        stopClick(e);
        onClick();
      }}
      disabled={disabled}
      aria-label={side === 'left' ? 'Назад' : 'Вперёд'}
      className={cn(
        // На телефоне листают пальцем, и стрелки там только закрывают картинку.
        // Видны и на узком экране: листать пальцем можно, но без стрелок
        // не видно, что лента вообще листается.
        'absolute top-1/2 z-10 inline-flex -translate-y-1/2 items-center justify-center',
        'rounded-full border border-border text-muted transition-all',
        'hover:text-ink disabled:opacity-40',
        overlay
          ? // Поверх кадра стрелка не должна его закрывать: мельче, полупрозрачна
            // и выходит из тени только под указателем.
            cn(
              'h-8 w-8 bg-bg/85 opacity-0 group-hover/deck:opacity-100 focus-visible:opacity-100',
              side === 'left' ? 'left-2' : 'right-2',
            )
          : cn(
              'h-10 w-10 bg-bg hover:shadow-md disabled:hover:shadow-none',
              side === 'left' ? 'left-0 -translate-x-3' : 'right-0 translate-x-3',
            ),
      )}
    >
      {side === 'left' ? (
        <ChevronLeft className={overlay ? 'h-4 w-4' : 'h-5 w-5'} />
      ) : (
        <ChevronRight className={overlay ? 'h-4 w-4' : 'h-5 w-5'} />
      )}
    </button>
  );
}
