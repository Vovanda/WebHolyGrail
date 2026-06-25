import type { SiteLayoutConfig } from 'contracts';

/**
 * Дефолтный layout-конфиг для veo55.
 *
 * @remarks
 * Когда `SiteSettings.layout` ещё не заполнен в админке — используем этот.
 * После того как админ один раз сохранит свой layout-конфиг в Payload — берём оттуда.
 *
 * Композиция:
 *  - top    : Header (узкий, лого + телефон + соц-иконки)
 *  - left   : NavDrawer (боковая drawer-панель с навигацией, sticky-бургер всегда виден)
 *  - center : PageOutlet (содержимое страничного маршрута, ширина=wide ≤ 1300px)
 *  - bottom : Footer
 */
export const CLASSIC_VEO55_LAYOUT: SiteLayoutConfig = {
  grid: { template: 'classic-site' },
  panels: [
    {
      id: 'header',
      slot: 'top',
      content: { kind: 'block', node: { blockType: 'header', id: 'panel-header' } },
      visibility: 'always',
      meta: { title: 'Шапка' },
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
      meta: { title: 'Меню', icon: 'menu' },
    },
    {
      id: 'page-outlet',
      slot: 'center',
      content: { kind: 'block', node: { blockType: 'page-outlet', id: 'panel-page-outlet' } },
      // 'full' — карточка center уже ограничена через SiteLayout (max-w-wide bg-bg),
      // дублировать ширинный wrapper не нужно.
      size: 'full',
      visibility: 'always',
      meta: { title: 'Контент страницы' },
    },
    {
      id: 'footer',
      slot: 'bottom',
      content: { kind: 'block', node: { blockType: 'footer', id: 'panel-footer' } },
      visibility: 'always',
      meta: { title: 'Подвал' },
    },
  ],
};
