import { BannerSliderBlock } from './BannerSlider';
import { HeroBlock } from './Hero';
import { QuoteBlock } from './Quote';
import { TimelineBlock } from './Timeline';
import { ProseBlock } from './Prose';
import { WaveDividerBlock } from './WaveDivider';

/**
 * Все доступные блоки для Pages.blocks. Добавляется здесь, появляется в
 * админке в drag-выборе.
 *
 * @remarks
 * Header / Footer / PageOutlet — это **layout-блоки** (живут в SiteSettings.layout.panels),
 * не в Pages.blocks. Тут только content-блоки страницы.
 */
export const PAGE_BLOCKS = [
  BannerSliderBlock,
  HeroBlock,
  QuoteBlock,
  TimelineBlock,
  ProseBlock,
  WaveDividerBlock,
];
