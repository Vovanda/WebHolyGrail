import type { ReactNode } from 'react';
import type { BlockNode, SiteSettings } from '@veo55/contracts';

import { Header } from '@/blocks/content/Header';
import { Footer } from '@/blocks/content/Footer';
import { BannerSliderBlock } from '@/blocks/primitives/BannerSliderBlock';
import { NavDrawer } from '@/blocks/content/NavDrawer';
import { Hero } from '@/blocks/primitives/Hero';
import { Quote } from '@/blocks/primitives/Quote';
import { Timeline } from '@/blocks/primitives/Timeline';
import { Prose } from '@/blocks/primitives/Prose';
import { WaveDivider } from '@/blocks/primitives/WaveDivider';
import { AchievementBanner } from '@/blocks/primitives/AchievementBanner';
import { CertifiedNotice } from '@/blocks/primitives/CertifiedNotice';
import { ReusableRef } from '@/blocks/primitives/ReusableRef';
import { PageRef } from '@/blocks/primitives/PageRef';
import { LitterHeader } from '@/blocks/veo55/litter/LitterHeader';
import { LitterPairCardBlock } from '@/blocks/veo55/litter/LitterPairCardBlock';
import { LitterPuppies } from '@/blocks/veo55/litter/LitterPuppies';
import { Pedigree } from '@/blocks/veo55/dogs/Pedigree';
import { SocialFeedServer } from '@/blocks/primitives/social/SocialFeedServer';
import { FaqAccordion } from '@/blocks/primitives/FaqAccordion';
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
  'litter-header': (node, settings) => <LitterHeader node={node} settings={settings} />,
  'litter-pair-card': (node, settings) => <LitterPairCardBlock node={node} settings={settings} />,
  'litter-puppies': (node, settings) => <LitterPuppies node={node} settings={settings} />,
  pedigree: (node, settings) => <Pedigree node={node} settings={settings} />,
  'achievement-banner': (node, settings) => <AchievementBanner node={node} settings={settings} />,
  'certified-notice': (node, settings) => <CertifiedNotice node={node} settings={settings} />,
  'social-feed': (node, settings) => <SocialFeedServer node={node} settings={settings} />,
  'faq-accordion': (node, settings) => <FaqAccordion node={node} settings={settings} />,
  'reusable-ref': (node, settings) => <ReusableRef node={node} settings={settings} />,
  'page-ref': (node, settings) => <PageRef node={node} settings={settings} />,
  'page-outlet': (_node, _settings, children) => <PageOutlet>{children}</PageOutlet>,
};

/**
 * CSS-классы скрытия блока на брейкпоинтах согласно `data.visibility`.
 *
 * @remarks
 * Дефолт всех `*` — `true` (видно везде), чтобы существующие записи без
 * `visibility` не пропали. Возвращает пустую строку если все три true
 * (нет смысла лепить классы).
 *
 * Breakpoints (Tailwind default):
 *  - mobile:  < 768px       (`max-md:`)
 *  - tablet:  768–1023px    (`md:max-lg:`)
 *  - desktop: ≥ 1024px      (`lg:`)
 */
function visibilityClass(node: BlockNode): string {
  const v = (
    node.data as
      | { visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean } }
      | undefined
  )?.visibility;
  if (!v) return '';
  const desktop = v.desktop ?? true;
  const tablet = v.tablet ?? true;
  const mobile = v.mobile ?? true;
  if (desktop && tablet && mobile) return '';
  const classes: string[] = [];
  if (!mobile) classes.push('max-md:hidden');
  if (!tablet) classes.push('md:max-lg:hidden');
  if (!desktop) classes.push('lg:hidden');
  return classes.join(' ');
}

/**
 * Рендерит один BlockNode. Неизвестный тип логируется и игнорируется (graceful) —
 * чтобы новый блок в Payload-конфиге не положил весь сайт пока его React-имплементация
 * не доехала.
 *
 * Применяет visibility (если в `data.visibility` отключён один или несколько
 * брейкпоинтов — оборачивает в `<div>` с media-query классами).
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
  const rendered = renderer(node, settings, children);
  const vClass = visibilityClass(node);
  if (!vClass) return rendered;
  return <div className={vClass}>{rendered}</div>;
}
