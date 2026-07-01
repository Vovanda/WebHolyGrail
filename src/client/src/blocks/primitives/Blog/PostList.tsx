import type { BlogArticle, BlogGlobalSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { PostCard } from './PostCard';

/**
 * PostList — grid статей. Default 1 col mobile / 2 col md / 3 col lg.
 * Если `featured` задан — первая статья как `hero`, остальные как `card`.
 */
export interface PostListProps {
  readonly articles: ReadonlyArray<BlogArticle>;
  readonly globalBlog: BlogGlobalSettings;
  readonly featured?: boolean;
  readonly variant?: 'grid' | 'vertical';
  readonly className?: string;
}

export function PostList({
  articles,
  globalBlog,
  featured = false,
  variant = 'grid',
  className,
}: PostListProps) {
  if (articles.length === 0) {
    return <p className={cn('text-muted text-center py-12', className)}>Пока статей нет.</p>;
  }

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        {articles.map((article) => (
          <PostCard key={article.id} article={article} globalBlog={globalBlog} variant="compact" />
        ))}
      </div>
    );
  }

  // grid (with optional hero)
  if (featured && articles.length > 0) {
    // articles[0] безопасен: length > 0 в guard выше, но TS с noUncheckedIndexedAccess
    // не сужает — non-null assertion явный.
    const hero = articles[0]!;
    const rest = articles.slice(1);
    return (
      <div className={cn('flex flex-col gap-12', className)}>
        <PostCard article={hero} globalBlog={globalBlog} variant="hero" />
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rest.map((article) => (
              <PostCard key={article.id} article={article} globalBlog={globalBlog} variant="card" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8', className)}>
      {articles.map((article) => (
        <PostCard key={article.id} article={article} globalBlog={globalBlog} variant="card" />
      ))}
    </div>
  );
}
