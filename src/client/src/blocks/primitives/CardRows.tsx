import { layouts } from 'contracts';
import type { Cell } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * Сетка карточек: фигура задаётся раскладкой, а не числом колонок.
 *
 * @remarks
 * Раскладку приносит владелец из админки - «a b c e : a b d d», где имя это
 * номер карточки. Что он не описал, досчитывается сбалансированными рядами,
 * поэтому пустое поле даёт ту же сетку, что и раньше: без сироты в последнем
 * ряду.
 *
 * На широком экране фигура рисуется сеткой в половинных долях - так короткий
 * ряд встаёт по центру, а карточка, растянутая через два ряда, вообще становится
 * возможной: потоком её не выразить.
 *
 * Ниже широкого фигура не тащится: карточки текут одним потоком с переносом
 * и центровкой. Раскладка - свойство базовой ширины, и пересобирать её на каждом
 * экране значило бы тащить композицию скачками вместо того, чтобы сжимать.
 */
/** Зазор одной мерой: между карточками, между рядами и в расчёте ширины. */
const GAP = {
  sm: { flow: 'gap-3 md:gap-4', grid: 'lg:gap-4', value: '1rem' },
  md: { flow: 'gap-4 md:gap-5', grid: 'lg:gap-5', value: '1.25rem' },
  lg: { flow: 'gap-6 md:gap-8', grid: 'lg:gap-8', value: '2rem' },
} as const;

export function CardRows<T>({
  items,
  columns = 3,
  gap = 'md',
  tileLayout,
  tileLayoutMd,
  tileLayoutSm,
  as = 'div',
  className,
  children,
}: {
  readonly items: readonly T[];
  /** Сколько карточек помещается в ряд на широком экране. */
  readonly columns?: number;
  readonly gap?: 'sm' | 'md' | 'lg';
  /** Раскладка владельца на большом экране; пусто - фигура считается сама. */
  readonly tileLayout?: string | null | undefined;
  /** То же на среднем экране, от 768 до 1023 точек. */
  readonly tileLayoutMd?: string | null | undefined;
  /** То же на малом экране, до 767 точек. */
  readonly tileLayoutSm?: string | null | undefined;
  /**
   * Каким тегом собрать сетку. Список документов и подобное остаётся списком:
   * рисовать перечень набором div значило бы отобрать его смысл у тех,
   * кто слушает страницу, а не смотрит.
   */
  readonly as?: 'div' | 'ul';
  readonly className?: string | undefined;
  readonly children: (item: T, index: number) => React.ReactNode;
}) {
  if (items.length === 0) return null;

  const grid = layouts(
    { lg: tileLayout, md: tileLayoutMd, sm: tileLayoutSm },
    items.length,
    columns,
  );
  if (!grid.lg) return null;

  // Ищем по номеру карточки, а не по имени: досчитанным имени не дают.
  const at = (cells: ReadonlyArray<Cell> | undefined, index: number) =>
    cells?.find((cell) => cell.index === index);

  /*
    Порядок в разметке берётся с малого экрана: там плитки идут ровно так, как
    лежат, и переставить их некому. На экранах пошире порядок задают позиции.
  */
  const reading = [...(grid.sm?.cells ?? grid.lg.cells)].sort(
    (left, right) => left.row - right.row || left.column - right.column,
  );

  const Grid = as;
  const Tile = as === 'ul' ? 'li' : 'div';

  return (
    <Grid
      data-part="tiles"
      /*
        Разметка для своего стиля блока: сколько плиток, во сколько колонок они
        лежат и своя ли это фигура. Так правило можно нацелить на сетку
        определённого размера, не подписывая каждый блок руками.
      */
      data-tiles={items.length}
      data-columns={columns}
      data-layout={tileLayout?.trim() ? 'custom' : 'auto'}
      className={cn('grid', GAP[gap].flow, GAP[gap].grid, className)}
      /*
        Долей столько, сколько нужно этой ширине. Медиазапрос в разметку не
        положишь, поэтому число долей приезжает переменными, а выбирает между
        ними правило в стилях.
      */
      style={
        {
          '--card-gap': GAP[gap].value,
          '--tiles-sm': grid.sm?.columns ?? 2,
          '--tiles-md': grid.md?.columns ?? 4,
          '--tiles-lg': grid.lg.columns,
        } as React.CSSProperties
      }
    >
      {/*
        Карточки идут в том порядке, в каком их поставил владелец, а не в том,
        в каком они лежат в блоке. На широком экране порядок задаёт сетка, но ниже
        карточки текут потоком - там его задаёт только разметка, и без этого
        заданная перестановка на телефоне пропадала.
      */}
      {reading.map((cell) => {
        const index = cell.index;
        const item = items[index];
        if (item === undefined) return null;

        const lg = at(grid.lg?.cells, index) ?? cell;
        const md = at(grid.md?.cells, index) ?? lg;
        const sm = at(grid.sm?.cells, index) ?? md;

        return (
          <Tile
            key={index}
            data-part="tile"
            data-tile={cell.name || index + 1}
            data-row={lg.row}
            data-span={lg.width / 2}
            /*
              Место плитки на каждой ширине - переменными по той же причине:
              инлайн-стиль про медиазапросы не знает.
            */
            style={
              {
                '--sm-col': sm.column,
                '--sm-span': sm.width,
                '--sm-row': sm.row,
                '--sm-rows': sm.height,
                '--md-col': md.column,
                '--md-span': md.width,
                '--md-row': md.row,
                '--md-rows': md.height,
                '--lg-col': lg.column,
                '--lg-span': lg.width,
                '--lg-row': lg.row,
                '--lg-rows': lg.height,
              } as React.CSSProperties
            }
          >
            {children(item, index)}
          </Tile>
        );
      })}
    </Grid>
  );
}
