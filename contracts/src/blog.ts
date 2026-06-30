/**
 * Blog domain types — client-side contracts.
 *
 * Соответствуют Payload collections `articles` / `threads` / `tags` / `authors`
 * (см. cms/src/collections/). Client читает их через REST `/api/articles?depth=2`
 * (depth раскрывает relations).
 */

export interface BlogMediaRef {
  readonly id: string | number;
  readonly url: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
  readonly sizes?: Readonly<Record<string, { url: string; width: number; height: number }>>;
}

export interface BlogTag {
  readonly id: string | number;
  readonly slug: string;
  readonly label: string;
  readonly color?: string;
  readonly description?: string;
}

export interface BlogAuthor {
  readonly id: string | number;
  readonly slug: string;
  readonly name: string;
  readonly bio?: string;
  readonly avatar?: BlogMediaRef | null;
  readonly role?: string;
  readonly links?: ReadonlyArray<{ label: string; url: string }>;
}

export interface BlogThread {
  readonly id: string | number;
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly cover?: BlogMediaRef | null;
  readonly status: 'draft' | 'published';
  readonly order?: number;
}

export interface BlogDisplayOverrides {
  readonly showAuthor?: boolean | null;
  readonly showDate?: boolean | null;
  readonly showReadingTime?: boolean | null;
  readonly showTags?: boolean | null;
}

export interface BlogArticle {
  readonly id: string | number;
  readonly slug: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly lead?: string;
  readonly cover?: BlogMediaRef | null;
  readonly body: unknown; // Lexical AST
  readonly status: 'draft' | 'published';
  readonly publishedAt?: string;
  readonly readingTime?: number;
  readonly thread?: BlogThread | null;
  readonly tags?: ReadonlyArray<BlogTag>;
  readonly author?: BlogAuthor | null;
  readonly displayOverrides?: BlogDisplayOverrides;
  readonly seo?: {
    readonly title?: string;
    readonly description?: string;
    readonly ogImage?: BlogMediaRef | null;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Global blog settings из SiteSettings.blog group.
 * Per-article overrides → resolveDisplay() helper.
 */
export interface BlogGlobalSettings {
  readonly showAuthor: boolean;
  readonly showDate: boolean;
  readonly showReadingTime: boolean;
  readonly showTags: boolean;
  readonly postsPerPage: number;
  readonly defaultSort: 'newest' | 'oldest';
}

/**
 * Resolved display flags для одного Article (article-level override > global).
 * `null` / `undefined` в override → inherit global.
 */
export function resolveDisplay(
  article: Pick<BlogArticle, 'displayOverrides'>,
  global: BlogGlobalSettings,
): Required<BlogDisplayOverrides> {
  const ov = article.displayOverrides ?? {};
  return {
    showAuthor: ov.showAuthor ?? global.showAuthor,
    showDate: ov.showDate ?? global.showDate,
    showReadingTime: ov.showReadingTime ?? global.showReadingTime,
    showTags: ov.showTags ?? global.showTags,
  };
}

/**
 * Filter state для FilterBar primitive. URL-параметры в /blog ?tag=a,b &thread=x.
 */
export interface BlogFilterState {
  readonly tags?: ReadonlyArray<string>; // tag slugs
  readonly thread?: string; // thread slug
  readonly author?: string; // author slug
  readonly dateYear?: number;
  readonly dateMonth?: number;
  readonly sort?: 'newest' | 'oldest';
}
