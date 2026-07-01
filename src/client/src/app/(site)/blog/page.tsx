import type { BlogGlobalSettings } from 'contracts';

import { getSiteSettings, listArticles } from '@/lib/api-client';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { Pagination } from '@/blocks/primitives/Blog/Pagination';

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
  const blogSettings: BlogGlobalSettings =
    (settings as unknown as { blog?: BlogGlobalSettings })?.blog ?? DEFAULT_BLOG_SETTINGS;

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
    <main className="mx-auto max-w-wide px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-12">
      <header className="text-center flex flex-col gap-3">
        <h1 className="text-h1 font-display font-semibold text-ink tracking-tight">Блог</h1>
        <p className="text-muted">{listSubtitle(docs.length)}</p>
      </header>

      <PostList articles={docs} globalBlog={blogSettings} featured={currentPage === 1} />

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

const DEFAULT_BLOG_SETTINGS: BlogGlobalSettings = {
  showAuthor: true,
  showDate: true,
  showReadingTime: true,
  showTags: true,
  postsPerPage: 10,
  defaultSort: 'newest',
};

function listSubtitle(count: number): string {
  if (count === 0) return 'Пока статей нет — но скоро будут.';
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'статей';
  if (mod10 === 1 && mod100 !== 11) word = 'статья';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'статьи';
  return `${count} ${word} на странице`;
}
