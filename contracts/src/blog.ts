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
 * Данные блока `articles-section` — витрина статей на произвольной странице.
 *
 * @remarks
 * Блок хранит только параметры выборки, сами статьи докачивает компонент (R0).
 * При `manual` relationship приходит уже populated, но компонент всё равно
 * перезапрашивает по id — так у всех источников одинаковый depth.
 */
export interface ArticlesSectionData {
  readonly title?: string;
  readonly description?: string;
  readonly source: 'latest' | 'by-tag' | 'by-thread' | 'manual';
  readonly tag?: BlogTag | string | number | null;
  readonly thread?: BlogThread | string | number | null;
  readonly items?: ReadonlyArray<BlogArticle | string | number>;
  readonly limit?: number;
  readonly sort?: 'newest' | 'oldest';
  /**
   * Раскладка ленты. `divided` — лента журнала (крупный заголовок, лид, мета,
   * hairline между записями) и раскладка по умолчанию, `grid` — плитки,
   * `vertical` — компактный список, `featured-first` — первая запись крупно.
   */
  readonly layout?: 'divided' | 'grid' | 'vertical' | 'featured-first';
  readonly cta?: {
    readonly label?: string;
    readonly href?: string;
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

/**
 * Серия вместе с составом журнала — то, что нужно витрине.
 *
 * @remarks
 * Само по себе `BlogThread` не отвечает на вопрос «стоит ли открывать»: у
 * названия объекта нет ни числа записей, ни свежести. Витрине они нужны в
 * каждой карточке, поэтому считаются один раз при сборке страницы и едут
 * рядом, а не тянутся отдельным запросом из компонента карточки.
 */
export interface BlogThreadSummary {
  readonly thread: BlogThread;
  readonly articlesCount: number;
  /** ISO-дата последней опубликованной записи; `null` — журнал ещё пуст. */
  readonly lastPublishedAt: string | null;
}

/**
 * Данные блока `threads-section` — витрина серий на произвольной странице.
 *
 * @remarks
 * Парный к `articles-section`: тот показывает записи, этот — сами журналы.
 * Нужен там, где у сайта несколько параллельных серий (объекты подрядчика,
 * рубрики дневника, линейки продуктов) и на странице ожидается их перечень,
 * а не общая лента.
 *
 * Как и у соседа, блок хранит только параметры выборки — серии докачивает
 * компонент (R0).
 */
export interface ThreadsSectionData {
  readonly title?: string;
  readonly description?: string;
  /** `all` — все опубликованные серии, `manual` — выбранные руками и в их порядке. */
  readonly source: 'all' | 'manual';
  readonly items?: ReadonlyArray<BlogThread | string | number>;
  readonly limit?: number;
  /** `grid` — плитки с обложками, `list` — компактные строки. */
  readonly layout?: 'grid' | 'list';
  /** Прятать серии без единой записи: пустая карточка на витрине бесполезна. */
  readonly hideEmpty?: boolean;
  readonly cta?: {
    readonly label?: string;
    readonly href?: string;
  };
}

/**
 * Видео, подготовленное к показу.
 *
 * @remarks
 * Секрета потока здесь нет и быть не может: он живёт в CMS и уходит зрителю
 * только конвертом, через отдельный эндпоинт с проверкой доступа.
 */
export interface VideoStream {
  readonly id: string | number;
  /** Дорожки субтитров, если их завели. */
  readonly subtitles?: ReadonlyArray<VideoSubtitleTrack>;
  /** Оглавление записи, если его завели. */
  readonly chapters?: ReadonlyArray<VideoChapter>;
  /** Кадры для перемотки, если их сняли. */
  readonly storyboard?: VideoStoryboard | null;
  /** Адрес master.m3u8. */
  readonly playlistUrl: string;
  readonly status: 'pending' | 'processing' | 'ready' | 'failed';
  readonly access: 'public' | 'private';
  readonly qualities: ReadonlyArray<number>;
  readonly durationSeconds: number | null;
  readonly poster?: BlogMediaRef | null;
}

/**
 * Данные блока `video` — плеер на произвольной странице.
 *
 * @remarks
 * Редактор выбирает медиафайл, остальное блок берёт сам: адрес плейлиста,
 * качества и режим доступа приходят из карточки видео, а не задаются руками.
 */
export interface VideoBlockData {
  readonly title?: string;
  readonly description?: string;
  readonly video?: { id: string | number } | string | number | null;
  readonly poster?: BlogMediaRef | null;
  /** Ширина: в колонку текста или во всю ширину секции. */
  readonly width?: 'content' | 'wide';
}

/** Видео в плейлисте: то, что нужно строке списка, и ничего сверх. */
export interface VideoSetItem {
  readonly id: string | number;
  readonly code: string;
  readonly title: string;
  /** Адрес потока: пусто у закрытых и ещё не готовых. */
  readonly playlistUrl: string | null;
  readonly poster: string | null;
  readonly durationSeconds: number | null;
  readonly ready: boolean;
  readonly locked: boolean;
  readonly lockReason: 'sign-in-required' | 'not-entitled' | null;
}

/**
 * Лента кадров для перемотки.
 *
 * @remarks
 * Все кадры лежат одной картинкой сеткой: сотня отдельных файлов означала бы
 * сотню запросов на каждое движение по полосе времени.
 */
export interface VideoStoryboard {
  readonly url: string;
  readonly columns: number;
  readonly rows: number;
  readonly count: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
  /** Сколько секунд приходится на кадр. */
  readonly intervalSeconds: number;
}

/**
 * Глава записи: с какой секунды начинается кусок и как он называется.
 *
 * @remarks
 * Длинную запись смотрят кусками. Главы превращают полосу времени в оглавление,
 * и до нужного места доходят одним нажатием.
 */
export interface VideoChapter {
  readonly startSeconds: number;
  readonly title: string;
}

/**
 * Дорожка субтитров.
 *
 * @remarks
 * Отдельный файл рядом с записью: дорожки добавляют и меняют когда угодно, а
 * само видео при этом не пересобирается.
 */
export interface VideoSubtitleTrack {
  /** Код языка: `ru`, `en`. По нему браузер понимает, что за дорожка. */
  readonly language: string;
  /** Подпись в плеере: «Русские», «English». */
  readonly label: string;
  readonly src: string;
  /** Включать тем, кто ничего не выбирал сам. */
  readonly default?: boolean;
}

/**
 * Плейлист, в который входит видео.
 *
 * @remarks
 * Показывается на странице самого видео: зритель, пришедший по прямой ссылке,
 * видит, частью чего оно является, и куда идти за остальным.
 */
export interface VideoSetRef {
  readonly id: string | number;
  /** Короткий код плейлиста: из него собирается адрес. */
  readonly code: string | null;
  readonly title: string;
  /** Сколько видео внутри. */
  readonly count: number;
}

/**
 * Данные блока `videoSet` — плейлист видео на произвольной странице.
 *
 * @remarks
 * Состав приходит из самого плейлиста и здесь не дублируется: видео в него
 * добавляют и убирают, и вторая копия списка разошлась бы с ним на первой же
 * правке.
 *
 * Замок у каждого видео считается по зрителю, поэтому блок собирается на
 * сервере при каждом показе, а не берётся из кеша страницы.
 */
/**
 * Данные блока `demoAccess` — проба доступа по коду на витрине.
 *
 * @remarks
 * Ничего, кроме подписей: код выдаёт сервер, и только когда генератор включён
 * флагом окружения.
 */
export interface DemoAccessBlockData {
  readonly heading?: string;
  readonly text?: string;
}

export interface VideoSetBlockData {
  readonly heading?: string;
  readonly subtitle?: string;
  /**
   * Как показать плейлист.
   *
   * @remarks
   * `player` — плеер и список рядом: видео смотрят подряд, не уходя со
   * страницы. `list` — только список, каждый видео открывается на своей
   * странице.
   */
  readonly mode?: 'player' | 'list';
  readonly showCover?: boolean;
  readonly showTitle?: boolean;
  readonly showDescription?: boolean;
  readonly layout?: 'rows' | 'grid';
  readonly limit?: number | null;
  readonly showLink?: boolean;
  readonly playlist?: { id: string | number } | string | number | null;
}
