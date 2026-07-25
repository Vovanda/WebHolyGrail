import { notFound } from 'next/navigation';

import { getSiteSettings, getTagBySlug, listArticles } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { Pagination } from '@/blocks/primitives/Blog/Pagination';

/**
 * /blog/tag/[slug] — статьи одного тега. SSR (R14).
 */
type Params = { slug: string };
type SearchParams = { page?: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  return {
    title: `${tag.label} — материалы`,
    description: tag.description ?? `Все материалы по теме «${tag.label}».`,
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));

  const [tag, settings] = await Promise.all([getTagBySlug(slug), getSiteSettings()]);
  if (!tag) notFound();

  const blogSettings = resolveBlogSettings(settings);
  const {
    docs,
    totalPages,
    page: currentPage,
  } = await listArticles({
    page,
    limit: blogSettings.postsPerPage,
    sort: blogSettings.defaultSort,
    tagSlug: slug,
  });

  return (
    <main className="mx-auto max-w-wide px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-12">
      <header className="text-center flex flex-col gap-3">
        <p className="text-muted text-sm uppercase tracking-wide">Тема</p>
        <h1 className="text-h1 font-display font-semibold text-ink tracking-tight">{tag.label}</h1>
        {tag.description && <p className="text-muted max-w-prose mx-auto">{tag.description}</p>}
      </header>

      <PostList articles={docs} globalBlog={blogSettings} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hrefBuilder={(p) => (p === 1 ? `/blog/tag/${slug}` : `/blog/tag/${slug}?page=${p}`)}
        />
      )}
    </main>
  );
}
