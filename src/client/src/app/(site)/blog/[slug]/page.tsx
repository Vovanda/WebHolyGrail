import { notFound } from 'next/navigation';

import { resolveDisplay } from 'contracts';

import { getArticleBySlug, getSiteSettings, listArticles } from '@/lib/api-client';
import { resolveBlogSettings } from '@/lib/blog-settings';
import { lexicalToParagraphs } from '@/lib/lexical-text';
import { PublishedDateBadge } from '@/blocks/primitives/Blog/PublishedDateBadge';
import { ReadingTimeBadge } from '@/blocks/primitives/Blog/ReadingTimeBadge';
import { AuthorBadge } from '@/blocks/primitives/Blog/AuthorBadge';
import { TagList } from '@/blocks/primitives/Blog/TagList';
import { PostList } from '@/blocks/primitives/Blog/PostList';
import { LexicalRenderer } from '@/blocks/primitives/RichText';

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

/**
 * Лид показываем только если он говорит что-то сверх текста.
 *
 * @remarks
 * Лид — это превью для ленты, и его часто заполняют первым абзацем записи
 * (так делают и импортеры с других движков). На самой странице такой лид идёт
 * прямо над тем же абзацем и читается как случайно продублированный текст.
 */
export function showLead(lead: string | undefined, body: unknown): boolean {
  const trimmed = lead?.trim();
  if (!trimmed) return false;

  const normalize = (value: string): string =>
    value
      .replace(/[\s ]+/g, ' ')
      .replace(/[…]+$/u, '')
      .trim()
      .toLowerCase();

  const leadText = normalize(trimmed);
  if (!leadText) return false;

  // Сверяем не только с самым началом: у записей с Ghost первым абзацем идёт
  // подзаголовок («версия 2.0: с поправкой на то, что…»), а лид повторяет
  // второй абзац.
  const paragraphs = lexicalToParagraphs(body).slice(0, LEAD_LOOKAHEAD_PARAGRAPHS);
  return !paragraphs.some((paragraph) => normalize(paragraph).startsWith(leadText));
}

/** Сколько первых абзацев проверяем на совпадение с лидом. */
const LEAD_LOOKAHEAD_PARAGRAPHS = 3;

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
  const blogSettings = resolveBlogSettings(settings);
  const display = resolveDisplay(article, blogSettings);

  // Если статья в треде — подтянуть siblings
  const threadSiblings = article.thread
    ? (await listArticles({ threadSlug: article.thread.slug, limit: 10 })).docs.filter(
        (a) => a.id !== article.id,
      )
    : [];

  return (
    <article className="mx-auto max-w-content px-4 md:px-6 py-8 md:py-12 flex flex-col gap-6">
      {/*
        Переход к серии, в которую входит запись. Раньше здесь стояла карточка
        с рамкой: у плашки над заголовком не читалось назначение — кнопка
        неизвестно куда. Обычная строка мелким кеглем говорит и что это, и
        куда ведёт, до клика.
      */}
      {article.thread && (
        <a
          href={`/blog/thread/${article.thread.slug}`}
          className="group self-start text-sm text-muted transition-colors hover:text-ink"
        >
          Читать серию статей:{' '}
          {/* Название отделено кеглем и цветом, а не кавычками: в самих
              названиях объектов ёлочки уже встречаются, и вложенные пары
              читаются как опечатка. */}
          <span className="font-medium text-ink underline-offset-4 group-hover:underline">
            {article.thread.title}
          </span>
        </a>
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

      {showLead(article.lead, article.body) && (
        <p className="text-h4 font-display italic text-ink/90 leading-relaxed border-l-2 border-accent pl-4">
          {article.lead}
        </p>
      )}

      <LexicalRenderer value={article.body} className="text-lg" />

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
