import type { BlogThread } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * ThreadCard — карточка треда (серия Articles). Click → /blog/thread/<slug>.
 */
export interface ThreadCardProps {
  readonly thread: BlogThread;
  readonly articlesCount?: number;
  readonly variant?: 'card' | 'hero' | 'compact';
  readonly className?: string;
}

export function ThreadCard({
  thread,
  articlesCount,
  variant = 'card',
  className,
}: ThreadCardProps) {
  const href = `/blog/thread/${thread.slug}`;

  if (variant === 'hero') {
    return (
      <section className={cn('rounded-lg overflow-hidden bg-surface', className)}>
        {thread.cover?.url && (
          <img
            src={thread.cover.url}
            alt={thread.cover.alt ?? thread.title}
            className="w-full aspect-[21/9] object-cover"
            loading="eager"
          />
        )}
        <div className="p-6 md:p-8 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Серия
            {articlesCount
              ? ` · ${articlesCount} ${pluralize(articlesCount, 'статья', 'статьи', 'статей')}`
              : ''}
          </span>
          <h1 className="text-h2 font-display text-ink leading-tight">
            <a href={href} className="hover:underline">
              {thread.title}
            </a>
          </h1>
          {thread.description && (
            <p className="text-body text-muted leading-relaxed">{thread.description}</p>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={href}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 bg-surface',
          'hover:bg-surface-hover transition-colors',
          className,
        )}
      >
        <span className="text-xs font-semibold text-muted uppercase">Серия:</span>
        <span className="text-ink font-semibold">{thread.title}</span>
        {articlesCount !== undefined && (
          <span className="text-xs text-muted ml-auto">{articlesCount}</span>
        )}
      </a>
    );
  }

  // default = card
  return (
    <article
      className={cn('group flex flex-col gap-3 rounded-lg overflow-hidden bg-paper', className)}
    >
      {thread.cover?.url && (
        <a href={href} className="block overflow-hidden">
          <img
            src={thread.cover.url}
            alt={thread.cover.alt ?? thread.title}
            className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </a>
      )}
      <div className="px-1 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-muted font-semibold">
          Серия{articlesCount ? ` · ${articlesCount}` : ''}
        </span>
        <h3 className="text-h4 font-display font-semibold text-ink">
          <a href={href} className="hover:underline">
            {thread.title}
          </a>
        </h3>
        {thread.description && (
          <p className="text-body text-muted line-clamp-2">{thread.description}</p>
        )}
      </div>
    </article>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
