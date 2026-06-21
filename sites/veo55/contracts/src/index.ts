/**
 * @veo55/contracts — типы-разъём между client (Next) и cms (Payload).
 *
 * @remarks
 * **Однонаправленная зависимость (R3):** client и cms импортируют отсюда.
 * Этот пакет не зависит ни от чего из приложений — иначе образуется цикл и
 * разъём перестаёт работать как граница.
 *
 * При добавлении нового публичного типа:
 * 1. Определить нужен ли он обеим сторонам (если только cms — не сюда).
 * 2. Добавить TSDoc с описанием поля и единицами/допустимыми значениями.
 * 3. Reэкспортировать здесь.
 */

export type { MediaDoc, MediaSize, MediaRef } from './media';

export type { BlockNode, LayoutBlock, ImageRef, LinkRef } from './blocks';

export type { PageDoc, PageSeo } from './pages';

export type { SiteSettings, ContactsInfo, SocialLink } from './globals';

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

export type { DogDoc, DogTitle, DogSex, DogColor, PedigreeAncestor } from './dogs';

export type {
  LitterDoc,
  LitterStatus,
  Puppy,
  PuppyState,
  PairCard,
  LitterCardBlockNode,
  LitterHeaderBlockNode,
  LitterPairCardBlockNode,
  LitterPuppiesBlockNode,
  LitterPairImage,
} from './litters';

export type { ReusableBlockDoc, ReusableRefBlockNode, PageRefBlockNode } from './reusable';

export type { CertifiedNoticeBlockNode, CertifiedNoticeCriterion } from './notices';

export type { PedigreeBlockNode } from './pedigree';

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
  RkfDogDoc,
  RkfPhoto,
  RkfInfoField,
  RkfRelation,
  RkfSearchItem,
  RkfSearchPage,
} from './rkf';
