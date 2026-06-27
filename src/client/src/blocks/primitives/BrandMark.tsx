import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import type { MediaRef } from 'contracts';

/**
 * BrandMark — квадратный логотип сайта.
 *
 * Источник:
 *  1. `logo` (SiteSettings.logo) задан → рендер `<img>` (Payload Media,
 *     URL через resolveMediaUrl)
 *  2. Иначе → generic acronym-fallback из `siteName` («Web Holy Grail» → «WHG»,
 *     «Кафе Зерно» → «КЗ»). Квадратный chip с акцент-фоном.
 *
 * R5 чистая функция. R0 контент в БД — логотип/имя из SiteSettings.
 */
export function BrandMark({
  logo,
  siteName,
  size = 36,
  className,
}: {
  readonly logo?: MediaRef | null | undefined;
  readonly siteName: string;
  readonly size?: number;
  readonly className?: string;
}) {
  const logoUrl = resolveMediaUrl(logo ?? null);

  if (logoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={logoUrl}
        alt={siteName}
        className={cn('block object-contain', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const acronym = makeAcronym(siteName);
  const fontSize = Math.round(size * (acronym.length >= 3 ? 0.4 : 0.5));

  return (
    <span
      role="img"
      aria-label={siteName}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md',
        'bg-accent text-white font-display font-bold tracking-tight',
        className,
      )}
      style={{ width: size, height: size, fontSize, lineHeight: 1 }}
    >
      {acronym}
    </span>
  );
}

/** «Web Holy Grail» → «WHG», «Кафе Зерно» → «КЗ», «sawking-tech» → «ST». */
function makeAcronym(siteName: string): string {
  const words = siteName
    .split(/[\s\-_·/]+/u)
    .filter((w) => w.length > 0)
    .slice(0, 3);
  if (words.length === 0) return '?';
  return words.map((w) => w[0]!.toLocaleUpperCase()).join('');
}
