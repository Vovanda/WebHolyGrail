import { notFound } from 'next/navigation';

import { getAuthorBySlug, getSiteSettings, listArticles } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { Pagination } from '@/blocks/primitives/Blog/Pagination';
import { SectionEyebrow } from '@/blocks/primitives/SectionEyebrow';

/**
 * /blog/author/[slug] — записи одного автора. SSR (R14).
 *
 * @remarks
 * На этот адрес ведёт имя автора в мете каждой записи, поэтому маршрут нужен
 * и одноавторским сайтам: без него ссылка под каждой записью упирается в 404.
 */
type Params = { slug: string };
type SearchParams = { page?: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio ?? `Записи автора: ${author.name}.`,
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));

  const [author, settings] = await Promise.all([getAuthorBySlug(slug), getSiteSettings()]);
  if (!author) notFound();

  const blogSettings = resolveBlogSettings(settings);
  const {
    docs,
    totalDocs,
    totalPages,
    page: currentPage,
  } = await listArticles({
    page,
    limit: blogSettings.postsPerPage,
    sort: blogSettings.defaultSort,
    authorSlug: slug,
  });

  return (
    <main className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-12 flex flex-col gap-8 md:gap-10">
      <header className="flex items-start gap-4">
        {author.avatar?.url && (
          <img
            src={author.avatar.url}
            alt={author.avatar.alt ?? author.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
            loading="eager"
          />
        )}
        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-h2 font-display font-semibold text-ink tracking-tight">
            {author.name}
          </h1>
          {author.role && <p className="text-muted text-sm">{author.role}</p>}
          {author.bio && <p className="text-muted leading-relaxed">{author.bio}</p>}
          {author.links && author.links.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {author.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    className="text-accent hover:underline underline-offset-4"
                    rel="me noopener"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-5 md:gap-6">
        <SectionEyebrow aside={articleCount(totalDocs)}>Записи</SectionEyebrow>
        <PostList articles={docs} globalBlog={blogSettings} />
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hrefBuilder={(p) => (p === 1 ? `/blog/author/${slug}` : `/blog/author/${slug}?page=${p}`)}
        />
      )}
    </main>
  );
}

/** «1 запись» / «2 записи» / «5 записей». */
export function articleCount(count: number): string | null {
  if (count === 0) return null;
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'записей';
  if (mod10 === 1 && mod100 !== 11) word = 'запись';
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'записи';
  return `${count} ${word}`;
}
