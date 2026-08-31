/**
 * Типы движка - всё общее, что есть у любого сайта на этом шаблоне.
 *
 * @remarks
 * Файл ездит обновлением целиком и всегда полон: новый общий тип доезжает
 * до сайтов сам, без правки точки сборки.
 *
 * Доменные типы конкретного сайта сюда не попадают - им место в своих файлах,
 * а собираются они в `index.ts`, который остаётся сайту.
 */

export type { MediaDoc, MediaSize, MediaStream, MediaRef } from './media';

export type {
  BlockNode,
  LayoutBlock,
  ImageRef,
  LinkRef,
  BlockSource,
  CarouselCard,
  CarouselBlockData,
  BlockPart,
} from './blocks';

/*
  Область видимости стиля блока считается в шве: её ставит сайт при отрисовке,
  а предупреждение показывает админка. Одно место на обе стороны.
*/
export { APPEARANCE_WARNING, PALETTE_COLORS, flattenParts, scopedAppearance } from './blocks';

export type { PageDoc, PageSeo } from './pages';

export type {
  SiteSettings,
  ContactsInfo,
  SocialLink,
  VideoSettings,
  VideoDeniedSettings,
} from './globals';

export type { ThemeConfig, ThemeName } from './theme';

export type {
  SiteLayoutConfig,
  PanelConfig,
  PanelContent,
  SlotName,
  PanelVisibility,
  PanelMobileStrategy,
} from './layout';

export type { FormSubmission, FormSubmissionStatus, FormSubmissionInput } from './forms';

export type { ReusableBlockDoc, ReusableRefBlockNode, PageRefBlockNode } from './reusable';

export type { CertifiedNoticeBlockNode, CertifiedNoticeCriterion } from './notices';

export type {
  FaqGroupDoc,
  FaqItemDoc,
  FaqAccordionBlockNode,
  FaqAccordionBlockData,
  FaqAccordionCta,
} from './faq';

export type {
  SocialSource,
  SocialPostDoc,
  SocialPostAuthor,
  SocialPostMedia,
  SocialPostMention,
  SocialPostMetrics,
  SocialComment,
  SocialFeedBlockNode,
  SocialFeedFilter,
} from './social';

export type {
  BlogMediaRef,
  BlogTag,
  BlogAuthor,
  BlogThread,
  BlogDisplayOverrides,
  BlogArticle,
  BlogGlobalSettings,
  BlogFilterState,
  ArticlesSectionData,
  BlogThreadSummary,
  ThreadsSectionData,
  VideoStream,
  VideoBlockData,
  VideoSetBlockData,
  DemoAccessBlockData,
  VideoSetItem,
  VideoSetRef,
  VideoSubtitleTrack,
  VideoChapter,
  VideoStoryboard,
} from './blog';
export { resolveDisplay } from './blog';

/**
 * Раскладка плиток: разбором пользуются и сайт, и админка - она проверяет
 * введённую строку и говорит человеку, что не так.
 */
export { parseAreas, hiddenTiles, areasWidth, placeAll, layout, layouts } from './grid-areas';
export type { Area, Cell, Layout, Layouts } from './grid-areas';
export { balancedRows, splitIntoRows } from './grid-rows';
