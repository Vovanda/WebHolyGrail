import { Fragment } from 'react';

import { rowBreaks, stretchOf, type RowWidth, type Shape } from '@/lib/aspect-rows';
import { cn } from '@/lib/utils';

/**
 * Докуда ряд может вырасти в высоту.
 *
 * @remarks
 * Ряды посчитаны так, чтобы дотягиваться до краёв колонки, и потолок выше,
 * чем у одиночного кадра в тексте. Он нужен ряду из одного кадра - на телефоне
 * стоячий снимок иначе вымахал бы на два экрана: предел ставится по высоте,
 * ширина считается от неё по пропорции самого кадра.
 */
const MAX_ROW_HEIGHT = 'var(--media-rows-max-h)';

const GAP = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
} as const;

/*
  Перенос строки нулевой высоты стоит своей строкой, и зазор между рядами
  удвоился бы - перенос забирает один зазор назад.
*/
const BREAK_PULL = {
  sm: '-mt-2',
  md: '-mt-3',
  lg: '-mt-4',
} as const;

/* Перенос виден только на своей ширине: на каждой ряды посчитаны свои. */
const BREAK_ON: Readonly<Record<RowWidth, string>> = {
  sm: 'md:hidden',
  md: 'hidden md:block lg:hidden',
  lg: 'hidden lg:block',
};

/**
 * Ряды одной высоты: ширина кадра берётся из его пропорций.
 *
 * @remarks
 * Плитка шаблона раскладывает равные ячейки - она хороша для однотипных
 * карточек. Снимкам нужно другое: вертикальные и горизонтальные должны лечь
 * рядом без обрезки в квадрат и без дырок в рядах.
 *
 * Какие кадры встанут в один ряд, считается на сервере для трёх ширин экрана
 * (`rowBreaks`): кадры по порядку делятся на ряды близкой высоты, и после
 * последнего кадра ряда стоит перенос, видимый только на своей ширине. Ширину
 * внутри ряда кадры делят пропорционально своей форме, поэтому высота ряда
 * выходит общей без кода в браузере.
 *
 * Форму ячейке задаёт раскладка, и кадр заполняет её целиком. Пропорции ячеек
 * приведены к пределам обычной съёмки, поэтому подрезка выходит мелкой, а ряд
 * остаётся ровным. Снимок как он снят показывает лента: там кадр открывается
 * целиком.
 *
 * Предмета раскладка не знает: видит форму и место, а что нарисовать внутри -
 * дело того, кто её поставил.
 */
export function AspectRows<T>({
  items,
  shapeOf,
  gap = 'md',
  className,
  children,
}: {
  readonly items: readonly T[];
  /** Где у элемента лежит его форма. */
  readonly shapeOf: (item: T) => Shape;
  readonly gap?: keyof typeof GAP;
  readonly className?: string;
  readonly children: (item: T, index: number) => React.ReactNode;
}) {
  if (items.length === 0) return null;

  const breaks = rowBreaks(items.map(shapeOf));
  const widths = Object.keys(BREAK_ON) as RowWidth[];

  return (
    /*
      Неполный ряд встаёт по центру, а не прижимается к левому краю: полные
      ряды занимают всю ширину и центрирование их не трогает, а у последнего
      остаток поля делится поровну - иначе справа зияет пустота.
    */
    <div
      data-part="aspect-rows"
      className={cn('flex flex-wrap justify-center', GAP[gap], className)}
    >
      {items.map((item, index) => {
        const { aspect } = stretchOf(shapeOf(item));
        return (
          <Fragment key={index}>
            <div
              data-part="aspect-rows-cell"
              /*
              Доля роста равна пропорции: широкий кадр забирает в ряду больше
              места, чем стоячий, и оба выходят одной высоты.

              Ограничение стоит по высоте, а не по ширине: в ряду кадры должны
              дотягиваться до краёв, а один оставшийся - не растягиваться на всю
              ширину. Ширина у него считается от высоты по его же пропорции,
              поэтому вертикальный снимок остаётся вертикальным и занимает
              столько места, сколько ему положено.
            */
              style={{
                /*
                Ряд посчитан заранее и заканчивается переносом, поэтому ячейка
                растёт от нуля: ряд заполняет ширину ровно, а доли по пропорциям
                дают всем кадрам ряда одну высоту.
              */
                flexGrow: aspect,
                flexBasis: 0,
                /*
                Ширина ячейки не больше той, что даёт её собственная пропорция
                при предельной высоте ряда. Без этого неполный ряд растягивает
                вертикальный кадр до квадрата, и подрезка съедает половину
                снимка - хотя по высоте предел вроде бы соблюдён.
              */
                maxWidth: `calc(${MAX_ROW_HEIGHT} * ${aspect})`,
                maxHeight: MAX_ROW_HEIGHT,
                aspectRatio: aspect,
              }}
              className="min-w-0 overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
            >
              {children(item, index)}
            </div>
            {widths
              .filter((width) => breaks[width].includes(index))
              .map((width) => (
                <div
                  key={width}
                  aria-hidden
                  data-part="aspect-rows-break"
                  className={cn('h-0 basis-full', BREAK_PULL[gap], BREAK_ON[width])}
                />
              ))}
          </Fragment>
        );
      })}
    </div>
  );
}
