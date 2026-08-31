import { BannerSliderBlock } from './BannerSlider';
import { CarouselBlock } from './Carousel';
import { HeroBlock } from './Hero';
import { HeroSplitBlock } from './HeroSplit';
import { HeroCinematicBlock } from './HeroCinematic';
import { CustomMarkupBlock } from './CustomMarkup';
import { RequestFormBlock } from './RequestForm';
import { DocumentListBlock } from './DocumentList';
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
import { ThreadsSectionBlock } from './ThreadsSection';
import { VideoBlock } from './Video';
import { VideoSetBlock } from './VideoSet';
import { FaqAccordionBlock } from './FaqAccordion';
import { ReusableRefBlock } from './ReusableRef';
import { PageRefBlock } from './PageRef';

// WHG-specific landing blocks (используются для самой страницы WHG-template'а).
// Downstream-сайты могут отфильтровать их в своём cms/src/blocks/index.ts
// если они не нужны для конкретной ниши.

import { withAppearance } from './_appearance';

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
export const ENGINE_REUSABLE_INNER_BLOCKS = [
  BannerSliderBlock,
  CarouselBlock,
  HeroBlock,
  HeroSplitBlock,
  HeroCinematicBlock,
  CustomMarkupBlock,
  RequestFormBlock,
  DocumentListBlock,
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
  ThreadsSectionBlock,
  VideoBlock,
  VideoSetBlock,
  FaqAccordionBlock,
  /*
    Вид блока - у каждого: где показывать и как выглядит, одной свёрнутой
    секцией. Навешивается разом, а не переписыванием тридцати семи файлов,
    и новый блок получает то же поведение сам собой.
  */
].map((block) => withAppearance(block));

export const ENGINE_PAGE_BLOCKS = [
  ...ENGINE_REUSABLE_INNER_BLOCKS,
  withAppearance(ReusableRefBlock),
  withAppearance(PageRefBlock),
];
