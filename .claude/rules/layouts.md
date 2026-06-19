# Layout rules — Panel/Slot композиция в Web Holy Grail

> Расширение к R11 (`common.md`). Дисциплина подготовки макета сайта.
> Если правишь `SiteLayout` / `PanelConfig` / layout-presets — читай это перед.

## Принцип

Сайт собирается **композицией панелей**, не выбором layout-класса.

`SiteLayoutConfig.panels[]` — массив `PanelConfig`. Каждая панель сидит в одном из 6 слотов:
`top | bottom | left | right | center | overlay`.

Один компонент `<SiteLayout>` рендерит **любую** конфигурацию. Когда меняется композиция — внешний вид сайта меняется без правки страничных компонентов.

## Две независимых оси ширины

В проекте **две системы ограничения ширины**. Не смешивать.

### Ось 1 — Layout panels (рамка сайта)

- Источник: `SiteSettings.layout.panels[]`
- Кто живёт: Header, Footer, NavDrawer, page-outlet — обёртки сайта
- Регулируется: `panel.size: 'full' | 'wide' | 'content' | 'narrow'` (только для `center`)
- Реализация: `SiteLayout` → `PanelHost` → `centerWidthClass(panel.size)` оборачивает контент в `mx-auto max-w-* px-6`

### Ось 2 — Page content blocks (тело страницы)

- Источник: `page.blocks[]` из Payload `Pages`
- Кто живёт: Hero, Quote, Timeline, Prose, BannerSlider, WaveDivider
- Регулируется: **внутри самого блока** (`mx-auto max-w-wide px-6` в JSX блока)
- Почему так: блок знает **свой content-type** (Prose всегда читабельный 880px, Hero всегда wide 1300px). R5++ не нарушается — блок не лезет к родителю, он знает свою семантику.

**Не объединять оси.** Лишний слой ради нулевой выгоды. Если когда-нибудь content-блок должен будет менять ширину из админки — добавь `block.width` поле в Payload-схему, **не** переноси в panels.

## Карта слотов

| Slot      | Куда кладём                           | Как рендерится                                         | Ширина                   |
| --------- | ------------------------------------- | ------------------------------------------------------ | ------------------------ |
| `top`     | Header (sticky), top-banner           | flex column над center                                 | full (header сам решает) |
| `bottom`  | Footer, mobile-tabbar                 | flex column под center                                 | full                     |
| `center`  | PageOutlet (главное), статичные блоки | основной поток                                         | по `panel.size`          |
| `left`    | NavDrawer, sidebar-categories, TOC    | **fixed drawer поверх контента** (translateX, overlay) | не отъедает ширину       |
| `right`   | Aside, cart, chat, context-help       | симметрично left                                       | не отъедает ширину       |
| `overlay` | Fullscreen-search, modal-host         | **не реализован** — добавить при первом кейсе (R9)     | —                        |

### Почему `left/right` — drawer'ы поверх, не split-pane

Landing-сайт (R7) — контент стабилен по ширине, drawer выезжает overlay'ем. Это упрощённый AVOX-паттерн (там был resize + двойные табы, нам не нужно).

Если когда-нибудь понадобится split-pane (admin/dashboard) — это будет **другой `grid.template`** в `SiteLayoutConfig` (например `'app-shell'`), а не правка `'classic-site'`.

### Drawer-блок = `'use client'` со своим стейтом

NavDrawer и любые будущие drawer'ы **сами управляют своим open/close**. SiteLayout их просто хостит, никакого глобального стейта. Канон:

- Sticky burger-кнопка `fixed top-4 left-4` (или right-4) — всегда видна
- Drawer `fixed top-0 bottom-0 left-0` с `translate-x-0 | -translate-x-full`
- Overlay `fixed inset-0 bg-ink/40` при `open=true`, клик-вне закрывает
- Escape закрывает (keydown listener)
- При `open=true` ставим `document.body.style.overflow = 'hidden'` (scroll-lock)
- Ширина — `panel.data.width` (px) или `panel.size`
- Toggle-стейт **внутри drawer'а** — не нужны глобальные стораджи, не нужны custom events. Header / другие панели его не знают.

## Рецепт добавления панели

1. **Контракт блока** в `contracts/src/blocks.ts` (если блок новый) — JSON-сериализуемый интерфейс данных (R5+).
2. **CMS-блок** в `cms/src/blocks/` (если редактируется в админке) — Payload Block-config. Прописать в `cms/src/blocks/index.ts → PAGE_BLOCKS`.
3. **React-компонент** в `client/src/blocks/content/` или `system/` — реализация. Если интерактивный — `'use client'`.
4. **Регистрация рендера** в `client/src/layouts/site-layout/block-registry.tsx` — маппинг `blockType` → React-компонент.
5. **Добавить panel** в layout-preset (`client/src/layouts/presets/classic-veo55.ts` или новый preset):
   ```ts
   {
     id: 'my-panel',
     slot: 'left',
     content: { kind: 'block', node: { blockType: 'my-block', id: 'panel-my' } },
     size: 'wide',  // только для center
     mobile: 'overlay',
     visibility: 'always',
     meta: { title: 'Моя панель', icon: 'menu' },
   }
   ```
6. **Проверить рендер** через DOM: `data-panel-id="my-panel"` должен присутствовать в HTML.

## Что НЕ делать

- ❌ **Не хардкодить** `max-w-wide` в Header / Footer / NavDrawer — это рамка, ширина управляется через `panel.size`. (Исключение — content-блоки Hero/Quote/etc., см. Ось 2.)
- ❌ **Не лазить в глобальный стейт** из компонента панели — `SiteSettings` приходит как проп через `PanelHost`. Любой data должен приходить через пропсы.
- ❌ **Не делать `slot: 'left'` через split-pane** на landing'е — всегда drawer overlay.
- ❌ **Не дублировать одно UI в нескольких слотах** (burger в Header **и** в NavDrawer) — один источник правды.
- ❌ **Не плодить layout-presets «про запас»**. Один preset на сайт. Второй preset = второй сайт (R9).
- ❌ **Не вкладывать панели в панели через JSX**. Если нужна вложенность — это содержимое блока, не layout.
- ❌ **Не передавать `ReactNode` / callbacks** в `PanelConfig` (он JSON-сериализуем, R5+).

## Текущий layout veo55 (CLASSIC_VEO55_LAYOUT)

- `top` → Header (узкий, лого + телефон + соц-иконки, sticky `#1d1612`)
- `left` → NavDrawer (sticky burger top-4 left-4, drawer 280px)
- `center` (size=wide) → PageOutlet (page.blocks[] рендерятся напрямую, каждый сам себе wrapper)
- `bottom` → Footer

При добавлении категорий собак / TOC по странице — `slot: 'right'` через симметричный drawer (NavDrawer переиспользуется с `side: 'right'`).
