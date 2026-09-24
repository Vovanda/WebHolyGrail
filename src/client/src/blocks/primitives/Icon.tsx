import { cn } from '@/lib/utils';
import { COLOR_EMOJI_TOKEN, ICON_MAP } from '@/lib/icon-map';
import { darkThemeIconUrl } from '@/lib/icon-url';

/**
 * Icon — универсальный primitive для рендера любого icon-source:
 *  - URL → `<img>` (simple-icons CDN, favicons, локальные SVG)
 *  - Emoji в ICON_MAP → современная Lucide-иконка (см. lib/icon-map.ts)
 *  - Emoji вне маппинга → fallback на сам emoji через `<span>` с шрифтом
 *
 * Контент-менеджер в Payload вводит привычное emoji («📝», «💼»), на фронте
 * автоматически подменяется на чистый SVG. Маппинг расширяется по мере
 * появления новых emoji в контенте — `lib/icon-map.ts`.
 *
 * Опционально оборачивает в круглый/скруглённый фон (для feature-cards,
 * stack-rows, badges).
 *
 * R5 чистая функция. R9 универсальный primitive — используется в FeatureGrid,
 * StackTransparency, ProjectTypesGrid, FaqAccordion и любом блоке где нужна
 * consistent icon-семантика.
 */
export function Icon({
  icon,
  label,
  size = 40,
  background = 'transparent',
  rounded = 'full',
  innerScale = 0.6,
  className,
}: {
  /** URL или unicode-символ/emoji. */
  readonly icon: string;
  /** Альтернативный текст (для accessibility). */
  readonly label: string;
  /** Размер box'a в px. */
  readonly size?: number;
  /**
   * Фон box'a: токен палитры или 'transparent'. `logo-plate` - светлая плашка
   * в обеих темах, под знаки брендов в фирменном цвете.
   */
  readonly background?: 'transparent' | 'accent-soft' | 'surface' | 'bg' | 'paper' | 'logo-plate';
  /** Скругление углов: full / xl / lg / md / sm / none. */
  readonly rounded?: 'full' | 'xl' | 'lg' | 'md' | 'sm' | 'none';
  /** Доля размера которую занимает inner content (default 0.6 = 60%). */
  readonly innerScale?: number;
  readonly className?: string;
}) {
  const isUrl = /^https?:\/\//i.test(icon);
  /*
    Тёмный знак бренда на тёмной теме пропадает: для неё идёт светлый вариант.
    Кроме светлой плашки - она светлая и в тёмной теме, светлый знак на ней
    пропал бы уже сам.
  */
  const onDark = isUrl && background !== 'logo-plate' ? darkThemeIconUrl(icon) : null;
  const innerSize = Math.round(size * innerScale);
  const LucideIcon = !isUrl ? ICON_MAP[icon] : undefined;
  const colorClass = !isUrl ? COLOR_EMOJI_TOKEN[icon] : undefined;

  const bgClass = {
    transparent: '',
    'accent-soft': 'bg-accent-soft',
    surface: 'bg-surface',
    bg: 'bg-bg',
    paper: 'bg-paper',
    'logo-plate': 'bg-logo-plate',
  }[background];

  const roundedClass = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    lg: 'rounded-lg',
    md: 'rounded-md',
    sm: 'rounded-sm',
    none: '',
  }[rounded];

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        bgClass,
        roundedClass,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {isUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            className={cn('object-contain', onDark ? 'shot-light' : 'block')}
            style={{ width: innerSize, height: innerSize }}
          />
          {onDark && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={onDark}
              alt=""
              loading="lazy"
              className="shot-dark object-contain"
              style={{ width: innerSize, height: innerSize }}
            />
          )}
        </>
      ) : LucideIcon ? (
        <LucideIcon
          aria-hidden
          className={cn('text-ink/85', colorClass)}
          size={innerSize}
          strokeWidth={1.75}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex items-center justify-center text-ink/85"
          style={{
            width: innerSize,
            height: innerSize,
            fontSize: innerSize,
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      )}
    </span>
  );
}
