import { BannerSliderBlock } from './BannerSlider';
import { HeroBlock } from './Hero';
import { HeroSplitBlock } from './HeroSplit';
import { HeroCinematicBlock } from './HeroCinematic';
import { InstallSnippetBlock } from './InstallSnippet';
import { StackTransparencyBlock } from './StackTransparency';
import { ComparisonTableBlock } from './ComparisonTable';
import { FeatureGridBlock } from './FeatureGrid';
import { BuiltWithBlock } from './BuiltWith';
import { CtaBannerBlock } from './CtaBanner';
import { QuoteBlock } from './Quote';
import { TimelineBlock } from './Timeline';
import { ProseBlock } from './Prose';
import { RichTextBlock } from './RichText';
import { WaveDividerBlock } from './WaveDivider';
import { AchievementBannerBlock } from './AchievementBanner';
import { CertifiedNoticeBlock } from './CertifiedNotice';
import { SocialFeedBlock } from './SocialFeed';
import { ArticlesSectionBlock } from './ArticlesSection';
import { FaqAccordionBlock } from './FaqAccordion';
import { ReusableRefBlock } from './ReusableRef';
import { PageRefBlock } from './PageRef';

// WHG-specific landing blocks (используются для самой страницы WHG-template'а).
// Downstream-сайты могут отфильтровать их в своём cms/src/blocks/index.ts
// если они не нужны для конкретной ниши.
import { ProjectTypesGridBlock } from './whg/ProjectTypesGrid';
import { BlockShowcaseBlock } from './whg/BlockShowcase';

import { withVisibility } from './_visibility';

/**
 * Generic content-блоки template. Header/Footer/PageOutlet — layout-блоки
 * (живут в SiteSettings.layout.panels), не здесь.
 *
 * Domain-блоки (LitterHeader/Pedigree/DogCard/PuppyCard/...) добавляются
 * в инстансе через `src/cms/src/blocks/<niche>/index.ts` и подмешиваются
 * в `PAGE_BLOCKS` per-site.
 */

/**
 * Блоки доступные внутри `ReusableBlocks.content` — всё кроме `reusable-ref`,
 * чтобы исключить циклы.
 */
export const REUSABLE_INNER_BLOCKS = [
  BannerSliderBlock,
  HeroBlock,
  HeroSplitBlock,
  HeroCinematicBlock,
  InstallSnippetBlock,
  StackTransparencyBlock,
  ComparisonTableBlock,
  FeatureGridBlock,
  BuiltWithBlock,
  CtaBannerBlock,
  QuoteBlock,
  TimelineBlock,
  ProseBlock,
  RichTextBlock,
  WaveDividerBlock,
  AchievementBannerBlock,
  CertifiedNoticeBlock,
  SocialFeedBlock,
  ArticlesSectionBlock,
  FaqAccordionBlock,
  // WHG-specific:
  ProjectTypesGridBlock,
  BlockShowcaseBlock,
].map(withVisibility);

export const PAGE_BLOCKS = [
  ...REUSABLE_INNER_BLOCKS,
  withVisibility(ReusableRefBlock),
  withVisibility(PageRefBlock),
];
