import { cn } from '@/lib/utils';

/**
 * Pagination — SSR-friendly (URL-based). prev / next + N pages + ellipsis.
 *
 * `hrefBuilder` принимает page number, возвращает URL. Default: ?page=N на текущем pathname.
 */
export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hrefBuilder?: (page: number) => string;
  readonly className?: string;
}

export function Pagination({ currentPage, totalPages, hrefBuilder, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const href = hrefBuilder ?? ((p: number) => `?page=${p}`);

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav
      className={cn('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      <a
        href={currentPage > 1 ? href(currentPage - 1) : undefined}
        aria-disabled={currentPage <= 1}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-semibold',
          currentPage > 1
            ? 'bg-surface hover:bg-surface-hover text-ink'
            : 'text-muted cursor-not-allowed',
        )}
      >
        ←
      </a>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-muted">
            …
          </span>
        ) : (
          <a
            key={p}
            href={href(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              'min-w-[36px] px-2 py-1.5 rounded-md text-sm font-semibold text-center',
              p === currentPage
                ? 'bg-accent text-paper'
                : 'bg-surface hover:bg-surface-hover text-ink',
            )}
          >
            {p}
          </a>
        ),
      )}
      <a
        href={currentPage < totalPages ? href(currentPage + 1) : undefined}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-semibold',
          currentPage < totalPages
            ? 'bg-surface hover:bg-surface-hover text-ink'
            : 'text-muted cursor-not-allowed',
        )}
      >
        →
      </a>
    </nav>
  );
}

/**
 * Build display list: 1 … current-1 current current+1 … N
 */
function buildPageList(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: Array<number | '…'> = [1];
  if (current > 3) result.push('…');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) result.push(i);
  if (current < total - 2) result.push('…');
  result.push(total);
  return result;
}
