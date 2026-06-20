import { BannerSliderBlock } from './BannerSlider';
import { HeroBlock } from './Hero';
import { QuoteBlock } from './Quote';
import { TimelineBlock } from './Timeline';
import { ProseBlock } from './Prose';
import { WaveDividerBlock } from './WaveDivider';
import { LitterCardBlock } from './LitterCard';
import { LitterHeaderBlock } from './LitterHeader';
import { LitterPairCardBlock } from './LitterPairCard';
import { LitterPuppiesBlock } from './LitterPuppies';
import { AchievementBannerBlock } from './AchievementBanner';
import { CertifiedNoticeBlock } from './CertifiedNotice';
import { ReusableRefBlock } from './ReusableRef';
import { PageRefBlock } from './PageRef';
import { withVisibility } from './_visibility';

/**
 * Все доступные блоки для Pages.blocks. Добавляется здесь, появляется в
 * админке в drag-выборе.
 *
 * @remarks
 * Header / Footer / PageOutlet — это **layout-блоки** (живут в SiteSettings.layout.panels),
 * не в Pages.blocks. Тут только content-блоки страницы.
 */
/**
 * Блоки доступные внутри `ReusableBlocks.content` — всё кроме `reusable-ref`,
 * чтобы исключить циклы (reusable не ссылается на reusable). Если потребуется
 * вложение — добавить depth-guard в рендерер на клиенте.
 */
export const REUSABLE_INNER_BLOCKS = [
  BannerSliderBlock,
  HeroBlock,
  QuoteBlock,
  TimelineBlock,
  ProseBlock,
  WaveDividerBlock,
  LitterCardBlock,
  LitterHeaderBlock,
  LitterPairCardBlock,
  LitterPuppiesBlock,
  AchievementBannerBlock,
  CertifiedNoticeBlock,
].map(withVisibility);

export const PAGE_BLOCKS = [
  ...REUSABLE_INNER_BLOCKS,
  withVisibility(ReusableRefBlock),
  withVisibility(PageRefBlock),
];
