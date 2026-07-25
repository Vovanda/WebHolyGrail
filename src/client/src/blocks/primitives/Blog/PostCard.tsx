import type { BlogArticle, BlogGlobalSettings } from 'contracts';
import { resolveDisplay } from 'contracts';

import { cn } from '@/lib/utils';

import { PublishedDateBadge } from './PublishedDateBadge';
import { ReadingTimeBadge } from './ReadingTimeBadge';
import { AuthorBadge } from './AuthorBadge';
import { TagList } from './TagList';

/**
 * PostCard — превью одной статьи блога. Server component (R14).
 *
 * Variants:
 *  - `compact` — title + lead + meta (для sidebar / related)
 *  - `list`    — заголовок-крупно + lead + мета, без плитки (лента журнала)
 *  - `card`    — cover + title + lead + meta (для grid)
 *  - `hero`    — большой cover + title + subtitle + lead + author + дата
 *
 * Respects per-article `displayOverrides` + global `SiteSettings.blog.show*`
 * (через `resolveDisplay` helper из contracts).
 */
export interface PostCardProps {
  readonly article: BlogArticle;
  readonly globalBlog: BlogGlobalSettings;
  readonly variant?: 'compact' | 'list' | 'card' | 'hero';
  readonly className?: string;
}

export function PostCard({ article, globalBlog, variant = 'card', className }: PostCardProps) {
  const display = resolveDisplay(article, globalBlog);
  const href = `/blog/${article.slug}`;

  if (variant === 'hero') {
    return (
      <article className={cn('group', className)}>
        {article.cover?.url && (
          <a href={href} className="block overflow-hidden rounded-lg mb-6">
            <img
              src={article.cover.url}
              alt={article.cover.alt ?? article.title}
              className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="eager"
            />
          </a>
        )}
        <PostMeta article={article} display={display} className="mb-3" />
        <h1 className="text-h2 font-display text-ink tracking-tight">
          <a href={href} className="hover:underline">
            {article.title}
          </a>
        </h1>
        {article.subtitle && (
          <p className="mt-2 text-h4 text-muted font-display italic">{article.subtitle}</p>
        )}
        {article.lead && (
          <p className="mt-4 text-body text-ink/90 leading-relaxed">{article.lead}</p>
        )}
      </article>
    );
  }

  if (variant === 'list') {
    const cover = article.cover;
    return (
      <article className={cn('group', className)}>
        <div
          className={cn('flex flex-col gap-4', cover?.url && 'md:flex-row md:items-start md:gap-7')}
        >
          {cover?.url && (
            <a href={href} className="block shrink-0 overflow-hidden rounded-md md:w-56">
              <img
                src={cover.url}
                alt={cover.alt ?? article.title}
                className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </a>
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="text-h4 md:text-title-list font-display font-semibold text-ink tracking-tight">
              <a href={href} className="hover:underline underline-offset-4 decoration-1">
                {article.title}
              </a>
            </h3>
            {article.lead && (
              <p className="text-sm text-muted leading-relaxed line-clamp-2">{article.lead}</p>
            )}
            <PostMeta article={article} display={display} byline className="mt-1" />
            {display.showTags && article.tags && article.tags.length > 0 && (
              <TagList tags={article.tags} className="mt-1" />
            )}
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={cn('flex flex-col gap-1.5', className)}>
        <a href={href} className="text-ink hover:underline">
          <h3 className="font-display font-semibold leading-snug">{article.title}</h3>
        </a>
        {article.lead && (
          <p className="text-sm text-muted leading-snug line-clamp-2">{article.lead}</p>
        )}
        <PostMeta article={article} display={display} dense />
      </article>
    );
  }

  // default = 'card'
  return (
    <article
      className={cn('group flex flex-col gap-3 rounded-lg overflow-hidden bg-paper', className)}
    >
      {article.cover?.url && (
        <a href={href} className="block overflow-hidden rounded-md">
          <img
            src={article.cover.url}
            alt={article.cover.alt ?? article.title}
            className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </a>
      )}
      <div className="flex flex-col gap-2 px-1">
        <PostMeta article={article} display={display} />
        <h3 className="text-h4 font-display font-semibold text-ink leading-snug">
          <a href={href} className="hover:underline">
            {article.title}
          </a>
        </h3>
        {article.lead && (
          <p className="text-body text-muted line-clamp-3 leading-relaxed">{article.lead}</p>
        )}
        {display.showTags && article.tags && article.tags.length > 0 && (
          <TagList tags={article.tags} className="mt-1" />
        )}
      </div>
    </article>
  );
}

interface PostMetaProps {
  readonly article: BlogArticle;
  readonly display: ReturnType<typeof resolveDisplay>;
  readonly dense?: boolean;
  /** Строка «Автор — дата — время чтения» вместо элементов через пробел. */
  readonly byline?: boolean;
  readonly className?: string;
}

function PostMeta({ article, display, dense, byline, className }: PostMetaProps) {
  const parts = [
    display.showAuthor && article.author ? (
      <AuthorBadge key="author" author={article.author} />
    ) : null,
    display.showDate && article.publishedAt ? (
      <PublishedDateBadge key="date" date={article.publishedAt} />
    ) : null,
    display.showReadingTime && article.readingTime ? (
      <ReadingTimeBadge key="reading-time" minutes={article.readingTime} />
    ) : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-y-1 text-muted',
        byline ? 'gap-x-2' : 'gap-x-3',
        dense || byline ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      {byline
        ? parts.map((part, i) => (
            // eslint-disable-next-line react/no-array-index-key -- порядок частей меты фиксирован
            <span key={i} className="inline-flex items-center gap-x-2">
              {i > 0 && <span aria-hidden="true">—</span>}
              {part}
            </span>
          ))
        : parts}
    </div>
  );
}
