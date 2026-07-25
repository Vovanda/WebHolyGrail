import { notFound } from 'next/navigation';

import { getSiteSettings, getThreadBySlug, listArticles } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { Pagination } from '@/blocks/primitives/Blog/Pagination';

/**
 * /blog/thread/[slug] — все записи одной серии. SSR (R14).
 *
 * @remarks
 * Серия — это журнал: этапы работ по проекту, части лонгрида, дневник. Поэтому
 * порядок здесь хронологический (сначала старые), в отличие от ленты /blog.
 * Читатель заходит в середину и должен понять последовательность.
 */
type Params = { slug: string };
type SearchParams = { page?: string; sort?: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const thread = await getThreadBySlug(slug);
  if (!thread) return {};
  return {
    title: thread.title,
    description: thread.description ?? `Все записи серии «${thread.title}».`,
  };
}

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { page: pageParam, sort } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));

  const [thread, settings] = await Promise.all([getThreadBySlug(slug), getSiteSettings()]);
  if (!thread) notFound();

  const blogSettings = resolveBlogSettings(settings);
  const {
    docs,
    totalPages,
    page: currentPage,
  } = await listArticles({
    page,
    limit: blogSettings.postsPerPage,
    sort: sort === 'newest' ? 'newest' : 'oldest',
    threadSlug: slug,
  });

  const buildHref = (p: number) => {
    const query = new URLSearchParams();
    if (p > 1) query.set('page', String(p));
    if (sort === 'newest') query.set('sort', 'newest');
    const qs = query.toString();
    return qs ? `/blog/thread/${slug}?${qs}` : `/blog/thread/${slug}`;
  };

  return (
    <main className="mx-auto max-w-wide px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-12">
      <header className="text-center flex flex-col gap-3">
        <p className="text-muted text-sm uppercase tracking-wide">Серия</p>
        <h1 className="text-h1 font-display font-semibold text-ink tracking-tight">
          {thread.title}
        </h1>
        {thread.description && (
          <p className="text-muted max-w-prose mx-auto">{thread.description}</p>
        )}
      </header>

      <PostList articles={docs} globalBlog={blogSettings} variant="vertical" />

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} hrefBuilder={buildHref} />
      )}
    </main>
  );
}
