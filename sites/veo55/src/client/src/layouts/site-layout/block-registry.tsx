import type { ReactNode } from 'react';
import type { BlockNode, SiteSettings } from '@veo55/contracts';

import { Header } from '@/blocks/content/Header';
import { Footer } from '@/blocks/content/Footer';
import { BannerSliderBlock } from '@/blocks/content/BannerSliderBlock';
import { NavDrawer } from '@/blocks/content/NavDrawer';
import { Hero } from '@/blocks/content/Hero';
import { Quote } from '@/blocks/content/Quote';
import { Timeline } from '@/blocks/content/Timeline';
import { Prose } from '@/blocks/content/Prose';
import { WaveDivider } from '@/blocks/content/WaveDivider';
import { LitterCardBlock } from '@/blocks/content/LitterCardBlock';
import { AchievementBanner } from '@/blocks/content/AchievementBanner';
import { PageOutlet } from '@/blocks/system/PageOutlet';

/**
 * Block registry — маппинг `blockType` строки на React-компонент.
 *
 * @remarks
 * Регистр маленький намеренно — пополняется по мере появления первого
 * use-case-а конкретного блока (R9). PageOutlet — спец-блок, в него layout
 * пробрасывает `children` страничного маршрута (то что отдаёт `app/(site)/page.tsx`).
 */
type BlockRenderer = (node: BlockNode, settings: SiteSettings, children?: ReactNode) => ReactNode;

const REGISTRY: Record<string, BlockRenderer> = {
  header: (node, settings) => <Header node={node} settings={settings} />,
  footer: (node, settings) => <Footer node={node} settings={settings} />,
  'banner-slider': (node, settings) => <BannerSliderBlock node={node} settings={settings} />,
  'nav-drawer': (node, settings) => <NavDrawer node={node} settings={settings} />,
  hero: (node, settings) => <Hero node={node} settings={settings} />,
  quote: (node, settings) => <Quote node={node} settings={settings} />,
  timeline: (node, settings) => <Timeline node={node} settings={settings} />,
  prose: (node, settings) => <Prose node={node} settings={settings} />,
  'wave-divider': (node, settings) => <WaveDivider node={node} settings={settings} />,
  'litter-card': (node, settings) => <LitterCardBlock node={node} settings={settings} />,
  'achievement-banner': (node, settings) => <AchievementBanner node={node} settings={settings} />,
  'page-outlet': (_node, _settings, children) => <PageOutlet>{children}</PageOutlet>,
};

/**
 * Рендерит один BlockNode. Неизвестный тип логируется и игнорируется (graceful) —
 * чтобы новый блок в Payload-конфиге не положил весь сайт пока его React-имплементация
 * не доехала.
 */
export function renderBlockNode(
  node: BlockNode,
  settings: SiteSettings,
  children?: ReactNode,
): ReactNode {
  const renderer = REGISTRY[node.blockType];
  if (!renderer) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        `[block-registry] blockType="${node.blockType}" (id=${node.id}) не зарегистрирован. ` +
          `Добавь компонент в blocks/ и регистрируй здесь. Пока пропускаю.`,
      );
    }
    return null;
  }
  return renderer(node, settings, children);
}
