import Link from 'next/link';
import type { ArticlesSectionData, BlockNode, BlogArticle, SiteSettings } from 'contracts';

import { listArticles, listArticlesByIds } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { cn } from '@/lib/utils';

import { PostList } from './PostList';

/**
 * ArticlesSection — витрина статей внутри произвольной страницы.
 *
 * @remarks
 * Один блок закрывает «Избранное», «Последние записи», «Этапы проекта» и
 * «Статьи по тегу» — отличается только `source` (R9: обобщение снизу, а не
 * четыре почти одинаковых блока).
 *
 * Server-only (R14): выборка идёт на сервере, клиентского JS блок не добавляет.
 */
export interface ArticlesSectionProps {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
  readonly className?: string;
}

export async function ArticlesSection({ node, settings, className }: ArticlesSectionProps) {
  const data = (node.data ?? {}) as unknown as ArticlesSectionData;
  const globalBlog = resolveBlogSettings(settings);

  const articles = await fetchArticles(data);
  if (articles.length === 0) return null;

  const cta = data.cta?.href && data.cta.label ? data.cta : null;

  return (
    <section className={cn('mx-auto max-w-wide px-4 md:px-6 py-10 md:py-14', className)}>
      {/* Заголовок набран как у остальных секций страницы: на посадочной
          лента статей стоит в одном ряду с блоками услуг и опыта, и мелкий
          eyebrow рядом с ними читался как служебная подпись. */}
      {(data.title || data.description) && (
        <header className="mb-8 md:mb-10 text-center">
          {data.title && (
            <h2 className="font-display text-h3 md:text-h2 font-semibold text-ink">{data.title}</h2>
          )}
          {data.description && (
            <p className="text-muted mt-3 max-w-prose mx-auto">{data.description}</p>
          )}
        </header>
      )}

      <PostList
        articles={articles}
        globalBlog={globalBlog}
        variant={listVariant(data.layout)}
        featured={data.layout === 'featured-first'}
      />

      {cta && (
        <div className="mt-8 flex justify-center">
          <Link
            href={cta.href!}
            className="text-ink underline underline-offset-4 hover:text-muted transition-colors"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * Раскладка блока → вариант ленты. `featured-first` отличается от ленты только
 * первой записью, поток под ней остаётся тем же.
 */
function listVariant(layout: ArticlesSectionData['layout']): 'divided' | 'grid' | 'vertical' {
  if (layout === 'vertical') return 'vertical';
  if (layout === 'grid') return 'grid';
  return 'divided';
}

/** Выборка статей под выбранный источник. Неизвестный источник → пусто. */
async function fetchArticles(data: ArticlesSectionData): Promise<ReadonlyArray<BlogArticle>> {
  const limit = data.limit ?? 6;
  const sort = data.sort ?? 'newest';

  if (data.source === 'manual') {
    const ids = (data.items ?? []).map((item) =>
      typeof item === 'object' && item !== null ? item.id : item,
    );
    return listArticlesByIds(ids);
  }

  if (data.source === 'by-tag') {
    const slug = relationSlug(data.tag);
    if (!slug) return [];
    return (await listArticles({ limit, sort, tagSlug: slug })).docs;
  }

  if (data.source === 'by-thread') {
    const slug = relationSlug(data.thread);
    if (!slug) return [];
    return (await listArticles({ limit, sort, threadSlug: slug })).docs;
  }

  return (await listArticles({ limit, sort })).docs;
}

/**
 * Slug из relationship-поля. Payload отдаёт объект при populated depth и голый
 * id, если глубины не хватило — во втором случае фильтровать нечем.
 */
function relationSlug(
  value: { slug?: string } | string | number | null | undefined,
): string | null {
  if (value && typeof value === 'object' && typeof value.slug === 'string') return value.slug;
  return null;
}
