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

export type {
  FrameAspect,
  MediaDoc,
  MediaSize,
  MediaStream,
  MediaRef,
  MediaRenditionName,
} from './media';
export { MEDIA_RENDITIONS, fileKindOf, frameAspectOf } from './media';
export {
  PREVIEW_SCROLL_MESSAGE,
  previewScrollMessage,
  readPreviewScroll,
  scrollRatio,
  scrollTopFor,
} from './preview-scroll';
export type { PreviewScrollMessage } from './preview-scroll';

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
  PageBackgroundSettings,
  VideoSettings,
  VideoDeniedSettings,
} from './globals';
export { siteNav } from './globals';

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
  BlogColumnWidth,
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
export { BLOG_COLUMN_PX, BLOG_TEXT_PX, resolveDisplay } from './blog';

/**
 * Раскладка плиток: разбором пользуются и сайт, и админка - она проверяет
 * введённую строку и говорит человеку, что не так.
 */
export {
  areasProblem,
  parseAreas,
  hiddenTiles,
  areasWidth,
  placeAll,
  layout,
  layouts,
} from './grid-areas';
export type { Area, Cell, Layout, LayoutOptions, Layouts } from './grid-areas';
export { balancedRows, splitIntoRows } from './grid-rows';
export {
  BUYER_LIMITS,
  BUYER_STEP_TEXT,
  CANCEL_FROM_NEW_ONLY,
  CATALOG_HREF,
  DEFAULT_CART_HREF,
  DEFAULT_SHOP_MENU_TITLE,
  INVOICE_FINAL,
  INVOICE_STATUS_LABELS,
  INVOICE_OPEN,
  INVOICE_TOTAL_LABELS,
  INVOICE_TRANSITIONS,
  MAX_CART_LINES,
  MAX_EXTRA_LINES,
  MY_ORDERS_PAGE,
  MAX_QUANTITY,
  ORDER_FINAL,
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  REPORT_KINDS,
  STALE_ORDER_HOURS,
  boughtTogether,
  buildOrder,
  buyerStep,
  canInvoice,
  canOrder,
  checkBuyer,
  DEFAULT_CHECKOUT,
  DEFAULT_INVOICE_DUE_DAYS,
  cleanCart,
  catalogItemOf,
  currentPrice,
  discountPercent,
  LANE_HEAD,
  LANE_TAIL,
  laneNextPage,
  laneRing,
  fitCartToStock,
  depositLines,
  EXTRA_KINDS,
  extraLines,
  heldAmount,
  holdsStock,
  HOW_TO_BUY,
  isOverdue,
  LINE_REMOVE_FROM,
  liveLines,
  offerViewOf,
  orderTotal,
  paymentPrice,
  refundable,
  removeOrderLine,
  shopSettings,
  spreadDiscount,
  stockMoves,
} from './shop';
export type {
  Actor,
  AskField,
  BuildOrderResult,
  BuyerErrors,
  BuyerInvoiceView,
  BuyerLineView,
  BuyerOrderSummary,
  BuyerOrderView,
  BuyerInput,
  BuyerStep,
  CartLine,
  CatalogPreview,
  CatalogResultView,
  CatalogSectionSummary,
  DiscountBase,
  ExtraKind,
  ExtraLine,
  ExtraLineInput,
  CheckoutRules,
  HowToBuy,
  InvoiceAction,
  InvoiceKind,
  InvoicePurpose,
  InvoiceStatus,
  OfferSnapshot,
  OfferView,
  OfferDetailView,
  CatalogSectionView,
  OrderAction,
  OrderLine,
  OrderStatus,
  ShopSettings,
  ShopSettingsInput,
  StockFit,
  Transition,
} from './shop';
export {
  CURRENCIES,
  DEFAULT_BOOK,
  DEFAULT_RATES,
  MAX_UNITS,
  MICROS_PER_UNIT,
  bookRateAt,
  cancelScheduled,
  chainedRateAt,
  convertAt,
  formatMoney,
  moneyDecimal,
  fromBaseMicros,
  fromMoney,
  microsToUnits,
  parseMoney,
  rateAt,
  ratesFromVersions,
  scheduleRate,
  toBaseMicros,
  toMoney,
  unitsToMicros,
} from './money';
export type {
  Currency,
  ExchangeRate,
  Micros,
  Money,
  MoneyError,
  RateBook,
  RateResult,
  RateVersion,
  ScheduleResult,
} from './money';
export { ancestorsOf, findNode, sectionPath, sectionTree } from './catalog-tree';
export type { SectionLink, SectionNode } from './catalog-tree';
export {
  applyFilter,
  cardSpecs,
  cleanCharacteristics,
  editDistance,
  facetsOf,
  isSlug,
  normalize,
  PAGE_SIZE,
  pageOf,
  publicSpecs,
  RELATED_LIMIT,
  SHOP_CHARACTERISTICS,
  similarItems,
  visibleCharacteristics,
  readFilter,
  readPage,
  readSort,
  searchIn,
  searchIndex,
  searchItems,
  SORTS,
  sortItems,
  stemWord,
  specText,
  switchLayout,
  toggleValue,
  typoBudget,
  withShopCharacteristics,
  writeFilter,
} from './catalog';
export type {
  CatalogItem,
  Characteristic,
  Facet,
  FacetOption,
  FilterState,
  FilterView,
  Page,
  SearchIndex,
  Selection,
  SortKey,
  SortKeys,
  SpecKind,
  SpecValue,
} from './catalog';
export {
  MODULES,
  disabledBlocks,
  isModuleEnabled,
  moduleOfBlock,
  moduleOfCollection,
  moduleToggleKey,
  RESERVED_ROUTES,
  reservedRoute,
} from './modules';
export type { EngineModule, ModuleKey } from './modules';
export { checkPhone, DEFAULT_PHONE_FORMAT, isPhoneFormat, PHONE_FORMATS } from './phone';
export type { PhoneFormat, PhoneFormatKey } from './phone';
