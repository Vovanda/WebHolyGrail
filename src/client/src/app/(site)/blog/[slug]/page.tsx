import { notFound } from 'next/navigation';

import type { BlogGlobalSettings } from 'contracts';
import { resolveDisplay } from 'contracts';

import { getArticleBySlug, getSiteSettings, listArticles } from '@/lib/api-client';
import { PublishedDateBadge } from '@/blocks/primitives/Blog/PublishedDateBadge';
import { ReadingTimeBadge } from '@/blocks/primitives/Blog/ReadingTimeBadge';
import { AuthorBadge } from '@/blocks/primitives/Blog/AuthorBadge';
import { TagList } from '@/blocks/primitives/Blog/TagList';
import { ThreadCard } from '@/blocks/primitives/Blog/ThreadCard';
import { PostList } from '@/blocks/primitives/Blog/PostList';

/**
 * /blog/[slug] — детальная страница статьи. SSR (R14).
 *
 * Если Article.thread ≠ null → внизу блок «Другие статьи в этой серии».
 *
 * TODO в follow-up:
 *   - PostBody / LexicalRenderer (extended Lexical AST renderer)
 *   - Drop-cap первой буквы
 *   - Share buttons
 *   - Related-by-tags блок
 *   - Reading progress bar
 */
type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug).catch(() => null);
  if (!article) return { title: 'Статья не найдена' };
  return {
    title: article.seo?.title ?? article.title,
    description: article.seo?.description ?? article.lead,
    openGraph: {
      images: article.seo?.ogImage?.url ?? article.cover?.url,
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const settings = await getSiteSettings();
  const blogSettings: BlogGlobalSettings =
    (settings as unknown as { blog?: BlogGlobalSettings })?.blog ?? DEFAULT_BLOG_SETTINGS;
  const display = resolveDisplay(article, blogSettings);

  // Если статья в треде — подтянуть siblings
  const threadSiblings = article.thread
    ? (await listArticles({ threadSlug: article.thread.slug, limit: 10 })).docs.filter(
        (a) => a.id !== article.id,
      )
    : [];

  return (
    <article className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-12 flex flex-col gap-6">
      {article.thread && (
        <ThreadCard thread={article.thread} variant="compact" className="self-start" />
      )}

      <header className="flex flex-col gap-3">
        <h1 className="text-h1 font-display font-semibold text-ink tracking-tight leading-tight">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-h4 text-muted font-display italic">{article.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          {display.showAuthor && article.author && (
            <AuthorBadge author={article.author} variant="full" />
          )}
          {display.showDate && article.publishedAt && (
            <PublishedDateBadge date={article.publishedAt} />
          )}
          {display.showReadingTime && article.readingTime && (
            <ReadingTimeBadge minutes={article.readingTime} />
          )}
        </div>
        {display.showTags && article.tags && article.tags.length > 0 && (
          <TagList tags={article.tags} className="mt-2" />
        )}
      </header>

      {article.cover?.url && (
        <img
          src={article.cover.url}
          alt={article.cover.alt ?? article.title}
          className="w-full rounded-lg object-cover aspect-[16/9]"
          loading="eager"
        />
      )}

      {article.lead && (
        <p className="text-h4 font-display italic text-ink/90 leading-relaxed border-l-2 border-accent pl-4">
          {article.lead}
        </p>
      )}

      {/* TODO: PostBody / LexicalRenderer — пока заглушка с JSON dump в dev */}
      <ArticleBody body={article.body} />

      {threadSiblings.length > 0 && article.thread && (
        <section className="mt-12 pt-8 border-t border-border flex flex-col gap-6">
          <header className="flex items-baseline justify-between gap-4">
            <h2 className="text-h3 font-display text-ink">Другие статьи в этой серии</h2>
            <a
              href={`/blog/thread/${article.thread.slug}`}
              className="text-accent hover:underline text-sm font-semibold"
            >
              Вся серия →
            </a>
          </header>
          <PostList articles={threadSiblings} globalBlog={blogSettings} variant="vertical" />
        </section>
      )}
    </article>
  );
}

/**
 * Временный плейсхолдер для рендера Lexical AST. Будет заменён на
 * `LexicalRenderer` primitive (см. #46 follow-up / #48).
 */
function ArticleBody({ body }: { readonly body: unknown }) {
  if (!body || typeof body !== 'object') return null;
  return (
    <div className="prose prose-lg max-w-none text-ink leading-relaxed">
      <p className="italic text-muted">
        (PostBody / LexicalRenderer placeholder — будет в follow-up. Lexical AST в JSON ниже:)
      </p>
      <pre className="text-xs bg-surface p-4 rounded-md overflow-auto max-h-96">
        {JSON.stringify(body, null, 2)}
      </pre>
    </div>
  );
}

const DEFAULT_BLOG_SETTINGS: BlogGlobalSettings = {
  showAuthor: true,
  showDate: true,
  showReadingTime: true,
  showTags: true,
  postsPerPage: 10,
  defaultSort: 'newest',
};
