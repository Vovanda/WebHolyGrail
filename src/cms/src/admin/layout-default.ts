/**
 * CLASSIC_SITE_LAYOUT_JSON — дефолтный layout для SiteSettings.layout field.
 *
 * Дублирует структуру `src/client/src/layouts/presets/classic.ts` (cms не
 * импортирует из client/ — R3 boundary). Используется в LayoutJsonField
 * для кнопки «Reset to default» — копирует этот JSON в поле, юзер дальше
 * редактирует.
 */

export const CLASSIC_SITE_LAYOUT_JSON = {
  grid: { template: 'classic-site' },
  panels: [
    {
      id: 'header',
      slot: 'top',
      content: {
        kind: 'block',
        node: {
          blockType: 'header',
          id: 'panel-header',
          // Пусто намеренно: шапка сайта — его бренд и меню, а не GitHub
          // движка с кнопкой «Использовать шаблон».
          data: {},
        },
      },
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
      size: 'full',
      visibility: 'always',
      meta: { title: 'Page content' },
    },
    {
      id: 'footer',
      slot: 'bottom',
      content: {
        kind: 'block',
        node: {
          blockType: 'footer',
          id: 'panel-footer',
          // Пусто намеренно: футер сайта не рекламирует движок. Без docsLinks /
          // projectLinks Footer показывает пункты меню (footerNav, иначе mainNav).
          data: {},
        },
      },
      visibility: 'always',
      meta: { title: 'Footer' },
    },
  ],
} as const;
