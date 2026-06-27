import { cn } from '@/lib/utils';

/**
 * Icon — универсальный primitive для рендера любого icon-source:
 *  - URL → `<img>` (simple-icons CDN, favicons, локальные SVG)
 *  - Unicode-символ / emoji / короткий текст → `<span>` с центрированным шрифтом
 *
 * Гарантирует точное центрирование контента в фиксированном квадрате
 * независимо от типа: для `<img>` — `object-contain` + явный size в 60% от
 * box, для текста — `leading: 1` + `display: flex`.
 *
 * Опционально оборачивает в круглый/скруглённый фон (для feature-cards,
 * stack-rows, badges).
 *
 * R5 чистая функция, R14 SSR (без 'use client'). R9 универсальный primitive
 * — используется в FeatureGrid, StackTransparency и любом другом блоке где
 * нужна consistent icon-семантика.
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
  /** Фон box'a: tailwind color-name (например 'accent-soft', 'surface') или 'transparent'. */
  readonly background?: 'transparent' | 'accent-soft' | 'surface' | 'bg' | 'paper';
  /** Скругление углов: full / xl / lg / md / sm / none. */
  readonly rounded?: 'full' | 'xl' | 'lg' | 'md' | 'sm' | 'none';
  /** Доля размера которую занимает inner content (default 0.6 = 60%). */
  readonly innerScale?: number;
  readonly className?: string;
}) {
  const isUrl = /^https?:\/\//i.test(icon);
  const innerSize = Math.round(size * innerScale);

  const bgClass = {
    transparent: '',
    'accent-soft': 'bg-accent-soft',
    surface: 'bg-surface',
    bg: 'bg-bg',
    paper: 'bg-paper',
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
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={icon}
          alt=""
          className="block object-contain"
          style={{ width: innerSize, height: innerSize }}
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
