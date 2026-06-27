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
          data: {
            githubUrl: 'https://github.com/Vovanda/WebHolyGrail',
            primaryCta: {
              label: 'Использовать шаблон',
              href: 'https://github.com/Vovanda/WebHolyGrail/generate',
            },
          },
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
          data: {
            githubUrl: 'https://github.com/Vovanda/WebHolyGrail',
            tagline:
              'Self-hosted сайт с CMS и архитектурой, которая не заставит вас начинать заново через год.',
            docsLinks: [
              {
                label: 'Введение',
                href: 'https://github.com/Vovanda/WebHolyGrail/blob/main/docs/whg/00-overview.md',
              },
              {
                label: 'R-правила',
                href: 'https://github.com/Vovanda/WebHolyGrail/blob/main/docs/whg/30-philosophy.md',
              },
              {
                label: 'Деплой',
                href: 'https://github.com/Vovanda/WebHolyGrail/tree/main/docs',
              },
            ],
            projectLinks: [
              { label: 'GitHub', href: 'https://github.com/Vovanda/WebHolyGrail' },
              { label: 'Issues', href: 'https://github.com/Vovanda/WebHolyGrail/issues' },
              {
                label: 'Discussions',
                href: 'https://github.com/Vovanda/WebHolyGrail/discussions',
              },
            ],
          },
        },
      },
      visibility: 'always',
      meta: { title: 'Footer' },
    },
  ],
} as const;
