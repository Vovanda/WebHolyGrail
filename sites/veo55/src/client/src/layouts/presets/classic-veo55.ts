import type { SiteLayoutConfig } from '@veo55/contracts';

/**
 * Дефолтный layout-конфиг для veo55.
 *
 * @remarks
 * Когда `SiteSettings.layout` ещё не заполнен в админке — используем этот.
 * После того как админ один раз сохранит свой layout-конфиг в Payload — берём оттуда.
 *
 * Композиция = классический сайт-визитка:
 *  - top  : Header (sticky, тёмный)
 *  - center : PageOutlet (там рендерится содержимое страничного маршрута)
 *  - bottom : Footer
 *
 * Никаких left/right/overlay — нет необходимости.
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
      id: 'page-outlet',
      slot: 'center',
      content: { kind: 'block', node: { blockType: 'page-outlet', id: 'panel-page-outlet' } },
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
