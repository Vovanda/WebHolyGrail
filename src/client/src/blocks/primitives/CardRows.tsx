import { layout, tileIndex } from 'contracts';

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
  as = 'div',
  className,
  children,
}: {
  readonly items: readonly T[];
  /** Сколько карточек помещается в ряд на широком экране. */
  readonly columns?: number;
  readonly gap?: 'sm' | 'md' | 'lg';
  /** Раскладка владельца; пусто - фигура считается сама. */
  readonly tileLayout?: string | null | undefined;
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

  const grid = layout(tileLayout, items.length, columns);
  if (!grid) return null;

  // Порядок чтения: сверху вниз, слева направо.
  const reading = [...grid.cells].sort(
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
      className={cn(
        'flex flex-wrap justify-center',
        GAP[gap].flow,
        'lg:grid',
        GAP[gap].grid,
        className,
      )}
      style={
        {
          '--card-columns': columns,
          '--card-gap': GAP[gap].value,
          gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
        } as React.CSSProperties
      }
    >
      {/*
        Карточки идут в том порядке, в каком их поставил владелец, а не в том,
        в каком они лежат в блоке. На широком экране порядок задаёт сетка, но ниже
        карточки текут потоком - там его задаёт только разметка, и без этого
        заданная перестановка на телефоне пропадала.
      */}
      {reading.map((at) => {
        const index = tileIndex(at.name);
        const item = items[index];
        if (item === undefined) return null;

        return (
          <Tile
            key={at.name}
            data-part="tile"
            data-tile={at?.name}
            data-row={at?.row}
            data-span={at ? at.width / 2 : undefined}
            className={cn(
              'basis-full sm:basis-[calc((100%-var(--card-gap))/2)]',
              // Ниже широкого ширина карточки считается от числа колонок:
              // фигура здесь не участвует, карточки просто текут.
              'lg:basis-auto',
            )}
            style={
              at
                ? {
                    gridColumn: `${at.column} / span ${at.width}`,
                    gridRow: `${at.row} / span ${at.height}`,
                  }
                : undefined
            }
          >
            {children(item, index)}
          </Tile>
        );
      })}
    </Grid>
  );
}
