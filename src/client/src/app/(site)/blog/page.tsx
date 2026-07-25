import { getSiteSettings, listArticles } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { Pagination } from '@/blocks/primitives/Blog/Pagination';
import { SectionEyebrow } from '@/blocks/primitives/SectionEyebrow';

/**
 * /blog — список последних опубликованных статей с pagination.
 *
 * SSR (R14). Параметры:
 *   ?page=N  → pagination
 *
 * TODO в follow-up:
 *   - ?tags=a,b — multi-tag filter (нужен FilterBar primitive)
 *   - ?thread=x / ?author=x / ?year=Y&month=M
 *   - hero для featured post (SiteSettings.blog.featuredPostId)
 */
type SearchParams = { page?: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Блог',
    description: 'Статьи и материалы блога.',
  };
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const settings = await getSiteSettings();
  const blogSettings = resolveBlogSettings(settings);

  const {
    docs,
    totalPages,
    page: currentPage,
  } = await listArticles({
    page,
    limit: blogSettings.postsPerPage,
    sort: blogSettings.defaultSort,
  });

  return (
    <main className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-10">
      <h1 className="text-h2 font-display font-semibold text-ink tracking-tight">Блог</h1>

      <div className="flex flex-col gap-5 md:gap-6">
        <SectionEyebrow aside={listSubtitle(docs.length)}>Последние</SectionEyebrow>
        <PostList articles={docs} globalBlog={blogSettings} featured={currentPage === 1} />
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hrefBuilder={(p) => (p === 1 ? '/blog' : `/blog?page=${p}`)}
        />
      )}
    </main>
  );
}

function listSubtitle(count: number): string | null {
  if (count === 0) return null;
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'статей';
  if (mod10 === 1 && mod100 !== 11) word = 'статья';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'статьи';
  return `${count} ${word}`;
}
