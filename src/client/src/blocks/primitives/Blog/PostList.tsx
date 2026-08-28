import type { BlogArticle, BlogGlobalSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { CardRows } from '../CardRows';
import { PostCard } from './PostCard';

/**
 * PostList — лента статей.
 *
 * Варианты:
 *  - `divided`  — лента журнала: запись за записью, hairline между ними (default)
 *  - `grid`     — плитки, 1 col mobile / 2 col md / 3 col lg
 *  - `vertical` — компактный список для sidebar
 *
 * Если `featured` задан — первая статья идёт крупным `hero`, остальные обычным
 * потоком выбранного варианта.
 */
export interface PostListProps {
  readonly articles: ReadonlyArray<BlogArticle>;
  readonly globalBlog: BlogGlobalSettings;
  readonly featured?: boolean;
  readonly variant?: 'divided' | 'grid' | 'vertical';
  /** Раскладка плиток именами областей. Пусто - фигура считается сама. */
  readonly tileLayout?: string | null | undefined;
  readonly tileLayoutMd?: string | null | undefined;
  readonly tileLayoutSm?: string | null | undefined;
  readonly className?: string;
}

export function PostList({
  articles,
  globalBlog,
  featured = false,
  variant = 'divided',
  tileLayout,
  tileLayoutMd,
  tileLayoutSm,
  className,
}: PostListProps) {
  if (articles.length === 0) {
    return <p className={cn('text-muted text-center py-12', className)}>Пока статей нет.</p>;
  }

  if (variant === 'divided') {
    const hero = featured ? articles[0] : undefined;
    const rest = hero ? articles.slice(1) : articles;
    return (
      <div className={cn('flex flex-col', className)}>
        {hero && <PostCard article={hero} globalBlog={globalBlog} variant="hero" />}
        {rest.map((article, i) => (
          <div
            key={article.id}
            className={cn(
              'py-6 md:py-7',
              i === 0 && !hero && 'pt-0',
              (i > 0 || hero) && 'border-t border-border',
              i === rest.length - 1 && 'pb-0',
            )}
          >
            <PostCard article={article} globalBlog={globalBlog} variant="list" />
          </div>
        ))}
      </div>
    );
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
          <CardRows
            items={rest}
            gap="lg"
            tileLayout={tileLayout}
            tileLayoutMd={tileLayoutMd}
            tileLayoutSm={tileLayoutSm}
          >
            {(article) => <PostCard article={article} globalBlog={globalBlog} variant="card" />}
          </CardRows>
        )}
      </div>
    );
  }

  return (
    <CardRows
      items={articles}
      gap="lg"
      tileLayout={tileLayout}
      {...(className ? { className } : {})}
    >
      {(article) => <PostCard article={article} globalBlog={globalBlog} variant="card" />}
    </CardRows>
  );
}
