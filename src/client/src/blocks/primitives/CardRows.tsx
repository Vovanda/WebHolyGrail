import { splitIntoRows } from '@/lib/card-rows';
import { cn } from '@/lib/utils';

/**
 * Сетка карточек, которая не оставляет одинокую карточку в последнем ряду.
 *
 * @remarks
 * Обычная сетка добирает остаток последней строкой: четыре карточки при трёх
 * колонках дают три и одну, и рядом с одинокой зияет пустота во всю ширину.
 * Здесь ряды считает `splitIntoRows`, а сама раскладка держит их видимыми:
 * карточки во всех рядах одной ширины, неполный ряд стоит по центру.
 *
 * На широком экране каждый ряд - своя строка. На планшете и телефоне ряды
 * распускаются: обёртка ряда перестаёт быть строкой и отдаёт карточки наружу
 * (`display: contents`), а те текут одним потоком с переносом и центровкой.
 * Иначе внутри каждого ряда получались бы обрубки вида «две и одна», а второй
 * набор карточек под узкие экраны раздувал бы разметку вдвое.
 */
export function CardRows<T>({
  items,
  columns = 3,
  gap = 'md',
  className,
  children,
}: {
  readonly items: readonly T[];
  /** Сколько карточек помещается в ряд на широком экране. */
  readonly columns?: number;
  readonly gap?: 'sm' | 'md';
  readonly className?: string;
  readonly children: (item: T, index: number) => React.ReactNode;
}) {
  if (items.length === 0) return null;

  const rows = splitIntoRows(items, columns);
  let offset = 0;

  return (
    <div
      className={cn(
        'flex flex-wrap justify-center',
        gap === 'sm' ? 'gap-3 md:gap-4' : 'gap-4 md:gap-5',
        'lg:block',
        gap === 'sm' ? 'lg:space-y-4' : 'lg:space-y-5',
        className,
      )}
      style={
        {
          '--card-columns': columns,
          '--card-gap': gap === 'sm' ? '1rem' : '1.25rem',
        } as React.CSSProperties
      }
    >
      {rows.map((row, rowIndex) => {
        const start = offset;
        offset += row.length;
        return (
          <div
            key={rowIndex}
            className={cn(
              'contents',
              'lg:flex lg:justify-center',
              gap === 'sm' ? 'lg:gap-4' : 'lg:gap-5',
            )}
          >
            {row.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'basis-full sm:basis-[calc((100%-var(--card-gap))/2)]',
                  // Ширина карточки - доля ряда за вычетом зазоров между ними,
                  // поэтому она одинакова и в полном ряду, и в коротком.
                  'lg:basis-[calc((100%-(var(--card-columns)-1)*var(--card-gap))/var(--card-columns))]',
                  'lg:shrink-0 lg:grow-0',
                )}
              >
                {children(item, start + i)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
