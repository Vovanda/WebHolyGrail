import type { SiteLayoutConfig } from 'contracts';

/**
 * Default classic site layout.
 *
 * @remarks
 * Used when `SiteSettings.layout` is not yet set in the admin — a sane default
 * so the first page render is never empty. As soon as the admin saves a custom
 * layout config in Payload — that value wins.
 *
 * Composition:
 *  - top    : Header (slim, logo + phone + social icons)
 *  - right  : NavDrawer (side drawer with navigation, sticky burger always visible)
 *  - center : PageOutlet (page route content, width = wide ≤ 1300px)
 *  - bottom : Footer
 */
export const CLASSIC_SITE_LAYOUT: SiteLayoutConfig = {
  grid: { template: 'classic-site' },
  panels: [
    {
      id: 'header',
      slot: 'top',
      content: { kind: 'block', node: { blockType: 'header', id: 'panel-header' } },
      visibility: 'always',
      meta: { title: 'Header' },
    },
    {
      id: 'nav-drawer',
      slot: 'right',
      content: {
        kind: 'block',
        node: {
          blockType: 'nav-drawer',
          id: 'panel-nav-drawer',
          data: { side: 'right', width: 280 },
        },
      },
      visibility: 'always',
      mobile: 'overlay',
      meta: { title: 'Menu', icon: 'menu' },
    },
    {
      id: 'page-outlet',
      slot: 'center',
      content: { kind: 'block', node: { blockType: 'page-outlet', id: 'panel-page-outlet' } },
      // 'full' — the center card is already constrained via SiteLayout (max-w-wide bg-bg),
      // no need to duplicate the width wrapper here.
      size: 'full',
      visibility: 'always',
      meta: { title: 'Page content' },
    },
    {
      id: 'footer',
      slot: 'bottom',
      content: { kind: 'block', node: { blockType: 'footer', id: 'panel-footer' } },
      visibility: 'always',
      meta: { title: 'Footer' },
    },
  ],
};
