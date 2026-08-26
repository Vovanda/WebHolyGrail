import { notFound } from 'next/navigation';

import { getSiteSettings, getThreadBySlug, listArticles } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { ThreadCard } from '@/blocks/primitives/Blog/ThreadCard';
import { Pagination } from '@/blocks/primitives/Blog/Pagination';
import { SectionEyebrow } from '@/blocks/primitives/SectionEyebrow';

/**
 * /blog/thread/[slug] — все записи одной серии. SSR (R14).
 *
 * @remarks
 * Серия — это журнал: этапы работ по объекту, части лонгрида, дневник. Поэтому
 * порядок здесь хронологический (сначала старые), в отличие от ленты /blog.
 * Читатель заходит в середину и должен понять последовательность.
 *
 * Ширина и подача — те же, что у `/blog`: обе страницы показывают один и тот же
 * список статей, и расходиться им не с чего. Раньше здесь была своя вёрстка —
 * центрированная шапка над прижатым влево списком и `variant="vertical"`,
 * рассчитанный на сайдбар: строки без обложек и лидов, растянутые на 1300px.
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
  const [{ docs, totalDocs, totalPages, page: currentPage }, latest] = await Promise.all([
    listArticles({
      page,
      limit: blogSettings.postsPerPage,
      sort: sort === 'newest' ? 'newest' : 'oldest',
      threadSlug: slug,
    }),
    // Дата последней записи в шапку: список отсортирован от старых к новым и
    // разбит на страницы, так что «последнюю» из него не взять.
    listArticles({ limit: 1, sort: 'newest', threadSlug: slug }),
  ]);

  const buildHref = (p: number) => {
    const query = new URLSearchParams();
    if (p > 1) query.set('page', String(p));
    if (sort === 'newest') query.set('sort', 'newest');
    const qs = query.toString();
    return qs ? `/blog/thread/${slug}?${qs}` : `/blog/thread/${slug}`;
  };

  return (
    <main className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-10">
      <ThreadCard
        thread={thread}
        variant="hero"
        headingLevel="h1"
        articlesCount={totalDocs}
        lastPublishedAt={latest.docs[0]?.publishedAt ?? null}
      />

      <div className="flex flex-col gap-5 md:gap-6">
        <SectionEyebrow aside={pageSubtitle(currentPage, totalPages)}>Записи</SectionEyebrow>
        <PostList articles={docs} globalBlog={blogSettings} />
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} hrefBuilder={buildHref} />
      )}
    </main>
  );
}

/** «Страница 2 из 5» — только когда страниц действительно несколько. */
function pageSubtitle(currentPage: number, totalPages: number): string | null {
  if (totalPages <= 1) return null;
  return `Страница ${currentPage} из ${totalPages}`;
}
